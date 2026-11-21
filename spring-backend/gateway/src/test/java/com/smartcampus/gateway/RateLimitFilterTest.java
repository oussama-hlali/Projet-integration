package com.smartcampus.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RateLimitFilterTest {

    @Test
    void authRequestsAreNeverRateLimited() {
        RateLimitFilter filter = new RateLimitFilter(1);
        AtomicInteger forwarded = new AtomicInteger();
        GatewayFilterChain chain = exchange -> {
            forwarded.incrementAndGet();
            return Mono.empty();
        };

        filter.filter(exchange(HttpMethod.POST, "/api/v1/auth/login"), chain).block();
        filter.filter(exchange(HttpMethod.OPTIONS, "/api/v1/auth/login"), chain).block();
        filter.filter(exchange(HttpMethod.POST, "/api/v1/auth/refresh"), chain).block();

        assertEquals(3, forwarded.get());
    }

    @Test
    void kpiReadsAreNeverRateLimited() {
        RateLimitFilter filter = new RateLimitFilter(1);
        AtomicInteger forwarded = new AtomicInteger();
        GatewayFilterChain chain = exchange -> {
            forwarded.incrementAndGet();
            return Mono.empty();
        };

        filter.filter(exchange(HttpMethod.GET, "/api/v1/identity/kpi"), chain).block();
        filter.filter(exchange(HttpMethod.GET, "/api/v1/campus/kpi"), chain).block();

        assertEquals(2, forwarded.get());
    }

    @Test
    void otherRequestsAreRateLimitedAfterConfiguredCapacity() {
        RateLimitFilter filter = new RateLimitFilter(1);
        AtomicInteger forwarded = new AtomicInteger();
        GatewayFilterChain chain = exchange -> {
            forwarded.incrementAndGet();
            return Mono.empty();
        };

        filter.filter(exchange(HttpMethod.GET, "/api/v1/rooms"), chain).block();

        MockServerWebExchange blocked = exchange(HttpMethod.GET, "/api/v1/rooms");
        filter.filter(blocked, chain).block();

        assertEquals(1, forwarded.get());
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, blocked.getResponse().getStatusCode());
    }

    private MockServerWebExchange exchange(HttpMethod method, String path) {
        return MockServerWebExchange.from(MockServerHttpRequest.method(method, path));
    }
}
