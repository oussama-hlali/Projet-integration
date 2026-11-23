package com.smartcampus.ai.adapter;

/** One role/content message in a conversation sent to an LLM provider. */
public record ChatTurn(String role, String content) {
}
