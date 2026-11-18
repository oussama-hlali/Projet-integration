package com.smartcampus.ai.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

@Service
public class QualityService {
    private final AtomicInteger requests = new AtomicInteger();
    private final AtomicInteger blocked = new AtomicInteger();

    public void recordRequest() { requests.incrementAndGet(); }
    public void recordBlocked() { blocked.incrementAndGet(); }

    public java.util.Map<String, Object> dashboard() {
        return java.util.Map.of(
                "provider", "stub",
                "requests", requests.get(),
                "blocked", blocked.get(),
                "dailyTokenCap", 10000
        );
    }
}
