package com.smartcampus.gateway;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Simple in-memory rate limiter: 100 requests / minute per client IP.
 * Good enough for v1; swap for a Redis-backed limiter if we scale out.
 */
@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    private static final int REQUESTS_PER_MINUTE = 100;

    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String clientIp = exchange.getRequest().getRemoteAddress() != null
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : "unknown";

        Bucket bucket = buckets.computeIfAbsent(clientIp, ip -> Bucket.builder()
                .addLimit(Bandwidth.classic(REQUESTS_PER_MINUTE, Refill.greedy(REQUESTS_PER_MINUTE, Duration.ofMinutes(1))))
                .build());

        if (bucket.tryConsume(1)) {
            return chain.filter(exchange);
        }

        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -100; // run before routing
    }
}
