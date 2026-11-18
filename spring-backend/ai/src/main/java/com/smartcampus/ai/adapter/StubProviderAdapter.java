package com.smartcampus.ai.adapter;

import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Stub provider used in dev. Returns canned replies and a hash-based embedding
 * so the service runs without any API key.
 */
@Component
public class StubProviderAdapter implements ProviderAdapter {

    @Override
    public String name() { return "stub"; }

    @Override
    public String chat(String prompt, List<String> availableTools) {
        String lower = prompt == null ? "" : prompt.toLowerCase();
        if (lower.contains("reservation") || lower.contains("book")) {
            return "I can help you reserve a room. Tell me the room, date and time slot.";
        }
        if (lower.contains("menu") || lower.contains("meal") || lower.contains("allerg")) {
            return "I can find meals that avoid your allergens. Share your allergies and I'll check today's menu.";
        }
        if (lower.contains("event")) {
            return "Here are the upcoming events. Use the events page for full details.";
        }
        return "I'm the Smart Campus assistant (stub mode). Ask me about rooms, events, meals or lost & found.";
    }

    @Override
    public float[] embed(String text) {
        // Deterministic hash-based pseudo-embedding of fixed size.
        int dim = 16;
        float[] v = new float[dim];
        if (text == null) return v;
        for (int i = 0; i < text.length(); i++) {
            v[i % dim] += (text.charAt(i) * 31 + i) % 100 / 100.0f;
        }
        // normalize
        double norm = 0;
        for (float f : v) norm += f * f;
        norm = Math.sqrt(norm);
        if (norm > 0) for (int i = 0; i < dim; i++) v[i] /= (float) norm;
        return v;
    }
}
