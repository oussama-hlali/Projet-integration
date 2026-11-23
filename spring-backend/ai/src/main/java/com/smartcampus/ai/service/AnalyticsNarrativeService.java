package com.smartcampus.ai.service;

import com.smartcampus.ai.adapter.ProviderAdapter;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Adds real LLM-written narratives to the analytics responses while the
 * numbers themselves stay computed from live KPI endpoints. When the stub
 * provider is active (no API key), this is a no-op.
 */
@Service
public class AnalyticsNarrativeService {

    private static final String SYSTEM_PROMPT = """
            You are a Smart Campus analytics writer. Return one plain-text paragraph of at most
            80 words. Use only the figures supplied in the prompt, never invent numbers, never
            use markdown, and never claim to have executed an action.
            """;

    private final ProviderAdapter provider;

    public AnalyticsNarrativeService(ProviderAdapter provider) {
        this.provider = provider;
    }

    /** Returns an LLM-written paragraph, or empty when unavailable/stubbed. */
    public String narrative(String instruction, String data) {
        if (provider == null || "stub".equalsIgnoreCase(provider.name())) return "";
        try {
            String reply = provider.chat(
                    SYSTEM_PROMPT,
                    List.of(),
                    instruction + "\n\nData:\n" + data,
                    List.of());
            return reply == null ? "" : reply.trim();
        } catch (Exception e) {
            return "";
        }
    }

    public String suffix() {
        return provider == null || "stub".equalsIgnoreCase(provider.name())
                ? "" : " Narrative generated with " + provider.name() + ".";
    }
}
