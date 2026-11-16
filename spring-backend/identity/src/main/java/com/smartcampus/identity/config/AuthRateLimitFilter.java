package com.smartcampus.identity.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Limits auth endpoints to 20 requests / minute / IP to slow down brute force.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int REQUESTS_PER_MINUTE = 20;
    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/v1/auth")) {
            filterChain.doFilter(request, response);
            return;
        }
        String ip = request.getRemoteAddr();
        Bucket bucket = buckets.computeIfAbsent(ip, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(REQUESTS_PER_MINUTE, Refill.greedy(REQUESTS_PER_MINUTE, Duration.ofMinutes(1))))
                .build());
        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.getWriter().write("{\"code\":\"RATE_LIMITED\"}");
        }
    }
}
