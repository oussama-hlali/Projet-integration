package com.smartcampus.ai.service;

import com.smartcampus.ai.adapter.ChatTurn;
import com.smartcampus.ai.adapter.ProviderAdapter;
import com.smartcampus.ai.domain.AiMessage;
import com.smartcampus.ai.repository.AiMessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

@Service
public class ChatService {

    private static final String SYSTEM_PROMPT = """
            You are the Smart Campus assistant. Answer clearly and concisely about campus rooms,
            reservations, events, announcements, transport, cafeteria meals, lost & found and
            notifications. Use the conversation history for context. Never claim to have executed
            an action; if an action is needed, describe it so the client can ask for confirmation.
            """;

    private final ProviderAdapter provider;
    private final AiMessageRepository messages;
    private final ModerationService moderation;
    private final BudgetService budget;

    public ChatService(ProviderAdapter provider, AiMessageRepository messages,
                       ModerationService moderation, BudgetService budget) {
        this.provider = provider;
        this.messages = messages;
        this.moderation = moderation;
        this.budget = budget;
    }

    public String chat(String userId, String message, List<String> tools) {
        return chat(userId, message, tools, null);
    }

    public String chat(String userId, String message, List<String> tools, String liveKpiContext) {
        return respond(userId, message, tools, liveKpiContext, null);
    }

    /** Streams provider tokens while still persisting the final assistant reply once. */
    public String stream(String userId, String message, List<String> tools, Consumer<String> tokenConsumer) {
        return stream(userId, message, tools, null, tokenConsumer);
    }

    public String stream(String userId, String message, List<String> tools, String liveKpiContext,
                         Consumer<String> tokenConsumer) {
        return respond(userId, message, tools, liveKpiContext, tokenConsumer);
    }

    private String respond(String userId, String message, List<String> tools, String liveKpiContext,
                           Consumer<String> tokenConsumer) {
        if (!moderation.isSafe(message)) {
            return "I can't help with that request.";
        }
        if (!budget.hasBudget(userId, 100)) {
            return "You've reached your daily AI usage limit.";
        }

        List<ChatTurn> history = recentHistory(userId);
        save(userId, "user", message);

        String systemPrompt = systemPrompt(liveKpiContext);
        String reply;
        if (tokenConsumer == null) {
            reply = provider.chat(systemPrompt, history, message, tools);
        } else {
            StringBuilder accumulated = new StringBuilder();
            provider.stream(systemPrompt, history, message, tools, token -> {
                accumulated.append(token);
                tokenConsumer.accept(token);
            });
            reply = accumulated.toString();
        }

        save(userId, "assistant", reply);
        budget.recordUsage(userId, 100);
        return reply;
    }

    /** Live KPI facts are prompt-only; they are never stored as conversation history. */
    private String systemPrompt(String liveKpiContext) {
        if (liveKpiContext == null || liveKpiContext.isBlank()) {
            return SYSTEM_PROMPT;
        }
        return SYSTEM_PROMPT + "\n\n" + liveKpiContext;
    }

    private List<ChatTurn> recentHistory(String userId) {
        List<AiMessage> all = history(userId);
        int from = Math.max(0, all.size() - 10);
        return all.subList(from, all.size()).stream()
                .map(m -> new ChatTurn(m.getRole(), m.getContent()))
                .toList();
    }

    private void save(String userId, String role, String content) {
        AiMessage entry = new AiMessage();
        entry.setId("m" + UUID.randomUUID().toString().substring(0, 8));
        entry.setUserId(userId);
        entry.setRole(role);
        entry.setContent(content);
        messages.save(entry);
    }

    public List<AiMessage> history(String userId) {
        return messages.findByUserIdOrderByCreatedAtAsc(userId);
    }
}
