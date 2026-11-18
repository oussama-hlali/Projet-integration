package com.smartcampus.notifications.controller;

import com.smartcampus.notifications.domain.Notification;
import com.smartcampus.notifications.service.NotificationService;
import com.smartcampus.notifications.service.OutboxService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class NotificationController {
    private final NotificationService notifications;
    private final OutboxService outbox;

    public NotificationController(NotificationService notifications, OutboxService outbox) {
        this.notifications = notifications; this.outbox = outbox;
    }

    @GetMapping("/notifications")
    public List<Notification> list(@RequestParam String userId) {
        return notifications.inbox(userId);
    }

    @GetMapping("/notifications/unread-count")
    public Map<String, Object> unreadCount(@RequestParam String userId) {
        return Map.of("count", notifications.unreadCount(userId));
    }

    @PatchMapping("/notifications/{id}")
    public Notification update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        boolean read = Boolean.TRUE.equals(body.get("read"));
        return notifications.markRead(id, read);
    }

    @PostMapping("/notifications/read-all")
    public Map<String, Object> markAllRead(@RequestParam String userId) {
        notifications.markAllRead(userId);
        return Map.of("ok", true);
    }

    @DeleteMapping("/notifications/{id}")
    public void delete(@PathVariable String id) { notifications.delete(id); }

    @DeleteMapping("/notifications")
    public void clearAll(@RequestParam String userId) { notifications.clearAll(userId); }

    // Internal ingest endpoint (called by other services) with idempotency via eventId.
    @PostMapping("/notifications/ingest")
    public Notification ingest(@RequestBody Map<String, String> body) {
        return notifications.ingest(
                body.get("userId"),
                body.get("type"),
                body.get("message"),
                body.get("eventId"));
    }

    // Outbox publish endpoint (for producers that prefer push).
    @PostMapping("/notifications/outbox")
    public Map<String, Object> publish(@RequestBody Map<String, String> body) {
        var e = outbox.publish(
                body.get("aggregateType"),
                body.get("aggregateId"),
                body.get("eventType"),
                body.get("payload"));
        return Map.of("id", e.getId(), "status", e.getStatus());
    }
}
