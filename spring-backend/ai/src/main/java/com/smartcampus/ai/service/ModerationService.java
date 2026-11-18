package com.smartcampus.ai.service;

import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Very small moderation / prompt-injection guard. Rejects obviously dangerous
 * input before it reaches the provider.
 */
@Service
public class ModerationService {
    private static final List<String> BLOCKED = List.of(
            "ignore previous", "system prompt", "jailbreak", "drop table", "delete from");

    public boolean isSafe(String input) {
        if (input == null) return true;
        String lower = input.toLowerCase();
        for (String b : BLOCKED) {
            if (lower.contains(b)) return false;
        }
        return true;
    }
}
