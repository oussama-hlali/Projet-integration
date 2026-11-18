package com.smartcampus.ai.controller;

import com.smartcampus.ai.service.AnalyticsService;
import com.smartcampus.ai.service.BudgetService;
import com.smartcampus.ai.service.ChatService;
import com.smartcampus.ai.service.ModerationService;
import com.smartcampus.ai.service.ProposalService;
import com.smartcampus.ai.service.QualityService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/v1/ai")
public class AssistantController {
    private final ChatService chat;
    private final ModerationService moderation;
    private final QualityService quality;
    private final BudgetService budget;
    private final ProposalService proposals;

    public AssistantController(ChatService chat, ModerationService moderation, QualityService quality,
                              BudgetService budget, ProposalService proposals) {
        this.chat = chat; this.moderation = moderation; this.quality = quality;
        this.budget = budget; this.proposals = proposals;
    }

    @PostMapping("/assistant/messages")
    public Map<String, Object> messages(@RequestBody Map<String, Object> body) {
        quality.recordRequest();
        String userId = (String) body.getOrDefault("userId", "u1");
        String message = (String) body.get("message");
        if (!moderation.isSafe(message)) { quality.recordBlocked(); return Map.of("reply", "I can't help with that request.", "proposals", List.of()); }
        String reply = chat.chat(userId, message, (List<String>) body.get("tools"));
        return Map.of("reply", reply, "proposals", List.of());
    }

    @GetMapping(value = "/assistant/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam String userId, @RequestParam String message) {
        quality.recordRequest();
        SseEmitter emitter = new SseEmitter(60_000L);
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                if (!moderation.isSafe(message)) { quality.recordBlocked(); emitter.send("I can't help with that request."); emitter.complete(); return; }
                String reply = chat.chat(userId, message, List.of());
                for (String word : reply.split(" ")) {
                    emitter.send(word + " ");
                    Thread.sleep(30);
                }
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }

    @PostMapping("/proposals")
    public Map<String, Object> createProposal(@RequestBody Map<String, String> body) {
        var p = proposals.create(body.getOrDefault("userId", "u1"), body.get("kind"), body.get("payload"));
        return Map.of("proposalId", p.getId(), "kind", p.getKind(), "status", p.getStatus(), "expiresAt", p.getExpiresAt().toString());
    }

    @GetMapping("/proposals")
    public Object listProposals(@RequestParam String userId) { return proposals.forUser(userId); }

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
