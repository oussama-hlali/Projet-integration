package com.smartcampus.ai.adapter;

import java.util.List;
import java.util.function.Consumer;

/**
 * Abstraction over an LLM provider. The rest of the AI service depends only on
 * this interface, so the real provider (OpenAI-compatible API) or the stub can
 * be selected by configuration without touching business logic.
 */
public interface ProviderAdapter {
    String name();

    String chat(String prompt, List<String> availableTools);

    float[] embed(String text);

    /**
     * Conversation-aware chat. Default implementations keep simple providers
     * working; real providers should override it.
     */
    default String chat(String systemPrompt, List<ChatTurn> history, String userMessage,
                        List<String> availableTools) {
        return chat(userMessage, availableTools);
    }

    /**
     * Token streaming. The consumer is called for each token as it arrives.
     * Providers that cannot stream emit the full reply once.
     */
    default void stream(String systemPrompt, List<ChatTurn> history, String userMessage,
                        List<String> availableTools, Consumer<String> tokenConsumer) {
        tokenConsumer.accept(chat(systemPrompt, history, userMessage, availableTools));
    }
}
