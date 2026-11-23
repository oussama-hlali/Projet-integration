package com.smartcampus.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.smartcampus.ai.config.AiGatewayProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Reads live campus KPIs through the gateway at assistant request time and
 * formats them as prompt context. Each source is independent: a failed or slow
 * endpoint is named as unavailable, and the assistant is told never to invent
 * values for it.
 */
@Service
public class KpiContextService {

    private static final Logger log = LoggerFactory.getLogger(KpiContextService.class);

    private static final String CONTEXT_HEADER =
            "LIVE CAMPUS KPI CONTEXT (measured at request time from the gateway; "
                    + "use only these values for numeric claims):";

    private static final List<KpiSource> SOURCES = List.of(
            new KpiSource("identity", "/api/v1/identity/kpi", List.of(
                    "usersTotal", "studentsCount", "staffCount", "adminsCount")),
            new KpiSource("campus", "/api/v1/campus/kpi", List.of(
                    "roomsTotal", "roomsAvailable", "roomsOccupied", "roomsReserved", "roomsMaintenance",
                    "reservationsTotal", "reservationsPending", "reservationsConfirmed",
                    "reservationsCancelled", "reservationsCompleted", "announcementsTotal", "transportRoutes")),
            new KpiSource("engagement", "/api/v1/engagement/kpi", List.of(
                    "eventsTotal", "upcomingEvents", "registrationsTotal", "lostFoundTotal",
                    "lostFoundOpen", "lostFoundClaimed")),
            new KpiSource("cafeteria", "/api/v1/cafeteria/kpi", List.of(
                    "menusTotal", "itemsTotal", "ordersTotal", "ordersCancelled", "ordersActive")),
            new KpiSource("notifications", "/api/v1/notifications/kpi", List.of(
                    "notificationsTotal", "notificationsUnread", "notificationsRead")));

    private final AiGatewayProperties properties;
    private final KpiFetcher fetcher;
    private final Executor executor;

    @Autowired
    public KpiContextService(AiGatewayProperties properties,
                             @Qualifier("kpiRestClient") RestClient client,
                             @Qualifier("aiKpiExecutor") Executor executor) {
        this(properties, httpFetcher(client), executor);
    }

    /** Lets tests bind a mock HTTP server while keeping the real fetch path. */
    KpiContextService(AiGatewayProperties properties, RestClient client) {
        this(properties, httpFetcher(client), Runnable::run);
    }

    /** Deterministic constructor for tests; no HTTP client or async threads. */
    KpiContextService(KpiFetcher fetcher) {
        this(new AiGatewayProperties(), fetcher, Runnable::run);
    }

    private KpiContextService(AiGatewayProperties properties, KpiFetcher fetcher, Executor executor) {
        this.properties = properties;
        this.fetcher = fetcher;
        this.executor = executor;
    }

    private static KpiFetcher httpFetcher(RestClient client) {
        return (path, authorization) -> {
            var request = client.get().uri(path);
            if (authorization != null && !authorization.isBlank()) {
                request.header(HttpHeaders.AUTHORIZATION, authorization);
            }
            return request.retrieve().body(JsonNode.class);
        };
    }

    /**
     * Returns prompt-ready live KPI context. Always returns a string, even when
     * every KPI source fails, so a data outage never blocks the assistant.
     */
    public String describe(String authorization) {
        List<Pending> pending = SOURCES.stream()
                .map(source -> new Pending(source, CompletableFuture.supplyAsync(
                        () -> fetchSource(source, authorization), executor)))
                .toList();

        CompletableFuture<?>[] all = pending.stream().map(Pending::future).toArray(CompletableFuture[]::new);
        try {
            CompletableFuture.allOf(all).get(Math.max(1, properties.getTimeoutMs()) + 1_000, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            pending.forEach(p -> p.future().cancel(true));
            return format(collectAfterFailure(pending, "interrupted"));
        } catch (TimeoutException e) {
            pending.forEach(p -> p.future().cancel(true));
            return format(collectAfterFailure(pending, "timed out"));
        } catch (ExecutionException e) {
            pending.forEach(p -> p.future().cancel(true));
            return format(collectAfterFailure(pending, "request failed"));
        }
        return format(pending.stream().map(p -> p.future().join()).toList());
    }

    private SourceResult fetchSource(KpiSource source, String authorization) {
        try {
            JsonNode data = fetcher.fetch(source.path(), authorization);
            if (data == null || !data.isObject()) {
                return new SourceResult(source, null, "invalid response");
            }
            return new SourceResult(source, data, null);
        } catch (Exception e) {
            log.warn("Live KPI source {} unavailable: {}", source.name(), e.getMessage());
            return new SourceResult(source, null, reason(e));
        }
    }

    private String reason(Exception e) {
        if (e instanceof TimeoutException || e instanceof ResourceAccessException) {
            return "timed out";
        }
        return "request failed";
    }

    private List<SourceResult> collectAfterFailure(List<Pending> pending, String failure) {
        List<SourceResult> results = new ArrayList<>();
        for (Pending p : pending) {
            CompletableFuture<SourceResult> future = p.future();
            if (future.isDone() && !future.isCompletedExceptionally() && !future.isCancelled()) {
                results.add(future.join());
            } else {
                results.add(new SourceResult(p.source(), null, failure));
            }
        }
        return results;
    }

    private String format(List<SourceResult> results) {
        StringBuilder context = new StringBuilder(CONTEXT_HEADER);
        for (SourceResult result : results) {
            if (result.failure() != null || result.data() == null) {
                continue;
            }
            List<String> fields = new ArrayList<>();
            for (String field : result.source().fields()) {
                JsonNode value = result.data().get(field);
                fields.add(field + "=" + (value == null || value.isNull() ? "n/a" : value.asText()));
            }
            context.append("\n- ").append(result.source().name()).append(": ")
                    .append(String.join("; ", fields));
        }

        List<String> unavailable = results.stream()
                .filter(r -> r.failure() != null || r.data() == null)
                .map(r -> r.source().name() + " (" + (r.failure() == null ? "no data" : r.failure()) + ")")
                .toList();

        if (unavailable.isEmpty()) {
            context.append("\nAll KPI sources were available at request time.");
        } else {
            context.append("\nUnavailable KPI sources: ").append(String.join(", ", unavailable))
                    .append(". Do not estimate or invent values for unavailable sources; "
                            + "say that live data is unavailable if asked about them.");
        }
        context.append("\nThese are current snapshot counts, not historical trends. "
                + "Do not present modelled values as measured facts.");
        return context.toString();
    }

    @FunctionalInterface
    public interface KpiFetcher {
        JsonNode fetch(String path, String authorization);
    }

    private record KpiSource(String name, String path, List<String> fields) {
    }

    private record SourceResult(KpiSource source, JsonNode data, String failure) {
    }

    private record Pending(KpiSource source, CompletableFuture<SourceResult> future) {
    }
}
