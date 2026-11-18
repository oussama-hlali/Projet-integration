package com.smartcampus.ai.adapter;

import java.util.List;

/**
 * Abstraction over an LLM provider. The rest of the AI service depends only on
 * this interface, so we can swap the real provider (OpenAI, Anthropic, ...) or
 * use the stub in dev/tests without touching business logic.
 */
public interface ProviderAdapter {
    String name();
    String chat(String prompt, List<String> availableTools);
    float[] embed(String text);
}
