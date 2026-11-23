package com.smartcampus.ai.controller;

import com.smartcampus.ai.service.ChatService;
import com.smartcampus.ai.service.ModerationService;
import com.smartcampus.ai.service.ProposalService;
import com.smartcampus.ai.service.QualityService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;

@RestController
@RequestMapping("/api/v1/ai")
public class AssistantController {
    private static final String BLOCKED = "I can't help with that request.";
    private static final String UNAVAILABLE = "The AI provider is unavailable right now. Please try again.";

    private final ChatService chat;
    private final ModerationService moderation;
    private final QualityService quality;
    private final ProposalService proposals;
    private final Executor streamExecutor;

    public AssistantController(ChatService chat, ModerationService moderation, QualityService quality,
                               ProposalService proposals,
                               @Qualifier("aiStreamExecutor") Executor streamExecutor) {
        this.chat = chat;
        this.moderation = moderation;
        this.quality = quality;
        this.proposals = proposals;
        this.streamExecutor = streamExecutor;
    }

    @PostMapping("/assistant/messages")
    public Map<String, Object> messages(@RequestBody Map<String, Object> body) {
        quality.recordRequest();
        String userId = (String) body.getOrDefault("userId", "u1");
        String message = (String) body.get("message");
        if (!moderation.isSafe(message)) {
            quality.recordBlocked();
            return Map.of("reply", BLOCKED, "proposals", List.of());
        }
        String reply;
        try {
            reply = chat.chat(userId, message, castTools(body.get("tools")));
        } catch (Exception e) {
            reply = UNAVAILABLE;
        }
        return Map.of("reply", reply, "proposals", List.of());
    }

    /**
     * Real token streaming from the configured provider. Each token is an SSE
     * "token" event; the stream ends with a "done" event.
     */
    @GetMapping(value = "/assistant/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> stream(@RequestParam String userId, @RequestParam String message) {
        quality.recordRequest();
        SseEmitter emitter = new SseEmitter(180_000L);

        streamExecutor.execute(() -> {
            try {
                if (!moderation.isSafe(message)) {
                    quality.recordBlocked();
                    emitter.send(SseEmitter.event().name("token").data(BLOCKED));
                } else {
                    chat.stream(userId, message, List.of(),
                            token -> sendSafely(emitter, "token", token));
                }
                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(UNAVAILABLE));
                    emitter.complete();
                } catch (Exception ignored) {
                    emitter.completeWithError(e);
                }
            }
        });

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .header("X-Accel-Buffering", "no")
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .body(emitter);
    }

    private void sendSafely(SseEmitter emitter, String eventName, Object data) {
        try {
            emitter.send(SseEmitter.event().name(eventName).data(data));
        } catch (Exception ignored) {
            // Client disconnected; the stream loop continues so usage is still recorded once.
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> castTools(Object value) {
        return value instanceof List<?> list ? (List<String>) list : List.of();
    }

    @PostMapping("/proposals")
    public Map<String, Object> createProposal(@RequestBody Map<String, String> body) {
        var p = proposals.create(body.getOrDefault("userId", "u1"), body.get("kind"), body.get("payload"));
        return Map.of("proposalId", p.getId(), "kind", p.getKind(), "status", p.getStatus(), "expiresAt", p.getExpiresAt().toString());
    }

    @GetMapping("/proposals")
    public Object listProposals(@RequestParam String userId) {
        return proposals.forUser(userId);
    }

    @PostMapping("/proposals/{id}/confirm")
    public Map<String, Object> confirm(@PathVariable String id) {
        var p = proposals.confirm(id);
        return Map.of("proposalId", p.getId(), "status", p.getStatus());
    }

    @PostMapping("/proposals/{id}/reject")
    public Map<String, Object> reject(@PathVariable String id) {
        var p = proposals.reject(id);
        return Map.of("proposalId", p.getId(), "status", p.getStatus());
    }
}
