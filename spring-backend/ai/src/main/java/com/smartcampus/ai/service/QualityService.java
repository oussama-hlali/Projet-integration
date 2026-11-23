package com.smartcampus.ai.service;

import com.smartcampus.ai.adapter.ProviderAdapter;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class QualityService {
    private final ProviderAdapter provider;
    private final AtomicInteger requests = new AtomicInteger();
    private final AtomicInteger blocked = new AtomicInteger();

    public QualityService(ProviderAdapter provider) {
        this.provider = provider;
    }

    public void recordRequest() {
        requests.incrementAndGet();
    }

    public void recordBlocked() {
        blocked.incrementAndGet();
    }

    public Map<String, Object> dashboard() {
        return Map.of(
                "provider", provider.name(),
                "requests", requests.get(),
                "blocked", blocked.get(),
                "dailyTokenCap", 10000
        );
    }
}
