package com.smartcampus.ai.service;

import com.smartcampus.ai.domain.AiUsage;
import com.smartcampus.ai.repository.AiUsageRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class BudgetService {
    private static final int DAILY_TOKEN_CAP = 10_000;
    private final AiUsageRepository repo;

    public BudgetService(AiUsageRepository repo) { this.repo = repo; }

    public boolean hasBudget(String userId, int estimatedTokens) {
        // simple: count tokens used today
        long used = repo.findAll().stream()
                .filter(u -> u.getUserId().equals(userId))
                .filter(u -> u.getCreatedAt().isAfter(Instant.now().minusSeconds(86400)))
                .mapToInt(AiUsage::getTokens).sum();
        return used + estimatedTokens <= DAILY_TOKEN_CAP;
    }

    public void recordUsage(String userId, int tokens) {
        AiUsage u = new AiUsage();
        u.setId("u" + UUID.randomUUID().toString().substring(0, 8));
        u.setUserId(userId);
        u.setTokens(tokens);
        repo.save(u);
    }
}
