package com.smartcampus.campus.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Best-effort publisher to the notifications service. Failures are ignored so a
 * notification outage never breaks the main flow.
 */
@Component
public class NotificationClient {
    private final RestTemplate rest = new RestTemplate();

    @Value("${NOTIFICATIONS_URL:http://localhost:8085}")
    private String baseUrl;

    public void notify(String userId, String type, String message, String eventId) {
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            rest.postForObject(baseUrl + "/api/v1/notifications/ingest",
                    new HttpEntity<>(Map.of("userId", userId, "type", type, "message", message, "eventId", eventId), h),
                    Object.class);
        } catch (Exception ignored) {
            // notifications are best-effort
        }
    }
}
