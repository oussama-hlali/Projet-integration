package com.smartcampus.ai.service;

import com.smartcampus.ai.adapter.ProviderAdapter;
import com.smartcampus.ai.domain.AiMessage;
import com.smartcampus.ai.repository.AiMessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ChatService {
    private final ProviderAdapter provider;
    private final AiMessageRepository messages;
    private final ModerationService moderation;
    private final BudgetService budget;

    public ChatService(ProviderAdapter provider, AiMessageRepository messages,
                      ModerationService moderation, BudgetService budget) {
        this.provider = provider; this.messages = messages;
        this.moderation = moderation; this.budget = budget;
    }

    public String chat(String userId, String message, List<String> tools) {
        if (!moderation.isSafe(message)) {
            return "I can't help with that request.";
        }
        if (!budget.hasBudget(userId, 100)) {
            return "You've reached your daily AI usage limit.";
        }
        // store user message
        AiMessage um = new AiMessage();
        um.setId("m" + UUID.randomUUID().toString().substring(0, 8));
        um.setUserId(userId);
        um.setRole("user");
        um.setContent(message);
        messages.save(um);

        String reply = provider.chat(message, tools);

        AiMessage am = new AiMessage();
        am.setId("m" + UUID.randomUUID().toString().substring(0, 8));
        am.setUserId(userId);
        am.setRole("assistant");
        am.setContent(reply);
        messages.save(am);

        budget.recordUsage(userId, 100);
        return reply;
    }

    public List<AiMessage> history(String userId) { return messages.findByUserIdOrderByCreatedAtAsc(userId); }
}
