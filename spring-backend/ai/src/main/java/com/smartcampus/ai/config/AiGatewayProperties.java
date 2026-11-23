package com.smartcampus.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Gateway settings used by the assistant to read live per-service KPI data.
 * The service calls the same JWT-protected endpoints as the admin UI, through
 * the gateway, forwarding the caller's Authorization header.
 */
@Component
@ConfigurationProperties(prefix = "ai.gateway")
public class AiGatewayProperties {

    private String baseUrl = "http://localhost:8080";
    private long timeoutMs = 4_000L;

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
