package com.smartcampus.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Provider settings bound from environment variables in application.yml.
 * The API key is never stored in source control or sent to the client.
 */
@Component
@ConfigurationProperties(prefix = "ai.provider")
public class AiProviderProperties {

    /** Either "openai" (OpenAI-compatible REST API) or "stub". */
    private String type = "stub";
    private String apiKey = "";
    private String model = "gpt-4o-mini";
    private String embeddingModel = "text-embedding-3-small";
    private String baseUrl = "https://api.openai.com/v1";
    private long timeoutMs = 30_000L;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getEmbeddingModel() {
        return embeddingModel;
    }

    public void setEmbeddingModel(String embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public long getTimeoutMs() {
        return timeoutMs;
    }

    public void setTimeoutMs(long timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    public String normalizedBaseUrl() {
        return baseUrl == null ? "" : baseUrl.trim().replaceAll("/+$", "");
    }
}
