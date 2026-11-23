package com.smartcampus.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartcampus.ai.config.AiGatewayProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class KpiContextServiceTest {

    private static final List<String> PATHS = List.of(
            "/api/v1/identity/kpi",
            "/api/v1/campus/kpi",
            "/api/v1/engagement/kpi",
            "/api/v1/cafeteria/kpi",
            "/api/v1/notifications/kpi");

    @Test
    void buildsMeasuredContextFromEveryKpiSource() {
        Map<String, Map<String, Long>> payloads = new LinkedHashMap<>();
        payloads.put(PATHS.get(0), Map.of("usersTotal", 10L, "studentsCount", 7L));
        payloads.put(PATHS.get(1), Map.of("roomsTotal", 40L, "roomsAvailable", 12L));
        payloads.put(PATHS.get(2), Map.of("eventsTotal", 5L, "lostFoundOpen", 3L));
        payloads.put(PATHS.get(3), Map.of("ordersTotal", 20L, "ordersActive", 8L));
        payloads.put(PATHS.get(4), Map.of("notificationsTotal", 50L, "notificationsUnread", 9L));
        List<String> forwarded = new ArrayList<>();

        KpiContextService service = new KpiContextService((path, authorization) -> {
            forwarded.add(authorization);
            return node(payloads.get(path));
        });

        String context = service.describe("Bearer valid-token");

        assertThat(context).contains(
                "identity: usersTotal=10",
                "campus: roomsTotal=40",
                "roomsAvailable=12",
                "engagement: eventsTotal=5",
                "cafeteria: menusTotal=n/a; itemsTotal=n/a; ordersTotal=20",
                "ordersActive=8",
                "notifications: notificationsTotal=50",
                "notificationsUnread=9",
                "All KPI sources were available at request time");
        assertThat(forwarded).hasSize(5).allMatch("Bearer valid-token"::equals);
    }

    @Test
    void namesUnavailableSourceAndKeepsSuccessfulNumbers() {
        KpiContextService service = new KpiContextService((path, authorization) -> {
            if (path.equals(PATHS.get(4))) {
                throw new IllegalStateException("down");
            }
            return node(Map.of("roomsAvailable", 7L));
        });

        String context = service.describe("Bearer valid-token");

        assertThat(context).contains(
                "campus: roomsTotal=n/a; roomsAvailable=7",
                "Unavailable KPI sources: notifications (request failed)",
                "Do not estimate or invent values for unavailable sources");
        assertThat(context).doesNotContain("notificationsTotal=");
    }

    @Test
    void returnsExplicitUnavailableContextWhenEverySourceFails() {
        KpiContextService service = new KpiContextService((path, authorization) -> {
            throw new IllegalStateException("down");
        });

        String context = service.describe(null);

        assertThat(context).contains(
                "identity (request failed)",
                "campus (request failed)",
                "engagement (request failed)",
                "cafeteria (request failed)",
                "notifications (request failed)",
                "Do not estimate or invent values for unavailable sources");
    }

    @Test
    void forwardsAuthorizationHeaderToGatewayKpiRequests() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://gateway.test");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder)
                .ignoreExpectOrder(true)
                .build();
        PATHS.forEach(path -> server.expect(requestTo("http://gateway.test" + path))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer caller-jwt"))
                .andRespond(withSuccess("{\"usersTotal\":10}", MediaType.APPLICATION_JSON)));

        AiGatewayProperties properties = new AiGatewayProperties();
        properties.setBaseUrl("http://gateway.test/");
        KpiContextService service = new KpiContextService(properties, builder.build());

        assertThat(service.describe("Bearer caller-jwt")).contains("usersTotal=10");
        server.verify();
    }

    private JsonNode node(Map<String, Long> values) {
        ObjectNode node = JsonNodeFactory.instance.objectNode();
        values.forEach(node::put);
        return node;
    }
}
