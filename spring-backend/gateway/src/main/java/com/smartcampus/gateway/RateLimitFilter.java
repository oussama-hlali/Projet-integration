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
 * Simple in-memory rate limiter: 300 requests / minute per client IP.
 * Auth flows, CORS preflights and KPI reads are exempt so login, refresh and admin
 * statistics stay available during a burst of requests. Swap for a Redis-backed
 * limiter if we scale out.
 */
@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    static final int DEFAULT_REQUESTS_PER_MINUTE = 300;

    private static final String AUTH_PATH_PREFIX = "/api/v1/auth/";
    private static final String KPI_PATH_SUFFIX = "/kpi";
    private static final String GET = "GET";
    private static final String OPTIONS = "OPTIONS";

    private final int requestsPerMinute;
    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimitFilter() {
        this(DEFAULT_REQUESTS_PER_MINUTE);
    }

    RateLimitFilter(int requestsPerMinute) {
        this.requestsPerMinute = requestsPerMinute;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (isExempt(exchange)) {
            return chain.filter(exchange);
        }

        String clientIp = exchange.getRequest().getRemoteAddress() != null
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : "unknown";

        Bucket bucket = buckets.computeIfAbsent(clientIp, ip -> Bucket.builder()
                .addLimit(Bandwidth.classic(requestsPerMinute,
                        Refill.greedy(requestsPerMinute, Duration.ofMinutes(1))))
                .build());

        if (bucket.tryConsume(1)) {
            return chain.filter(exchange);
        }

        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        return exchange.getResponse().setComplete();
    }

    private boolean isExempt(ServerWebExchange exchange) {
        String path = exchange.getRequest().getPath().value();
        String method = exchange.getRequest().getMethod().name();

        if (OPTIONS.equalsIgnoreCase(method) || path.startsWith(AUTH_PATH_PREFIX)) {
            return true;
        }
        return GET.equalsIgnoreCase(method) && path.endsWith(KPI_PATH_SUFFIX);
    }

    @Override
    public int getOrder() {
        return -100; // run before routing
    }
}
