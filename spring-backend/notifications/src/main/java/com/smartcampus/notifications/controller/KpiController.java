package com.smartcampus.notifications.controller;

import com.smartcampus.notifications.domain.Notification;
import com.smartcampus.notifications.repository.NotificationRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class KpiController {
    private final NotificationRepository repo;
    public KpiController(NotificationRepository repo) { this.repo = repo; }

    @GetMapping("/notifications/kpi")
    public Map<String, Object> kpi() {
        long total = repo.count();
        long unread = repo.findAll().stream().filter(n -> !n.isRead()).count();
        return Map.of(
                "notificationsTotal", total,
                "notificationsUnread", unread,
                "notificationsRead", total - unread
        );
    }
}
