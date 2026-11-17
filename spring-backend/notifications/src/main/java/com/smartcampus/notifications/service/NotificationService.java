package com.smartcampus.notifications.service;

import com.smartcampus.notifications.domain.Notification;
import com.smartcampus.notifications.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) { this.repo = repo; }

    public List<Notification> inbox(String userId) { return repo.findByUserIdOrderByCreatedAtDesc(userId); }

    public long unreadCount(String userId) { return repo.countByUserIdAndReadFalse(userId); }

    @Transactional
    public Notification ingest(String userId, String type, String message, String eventId) {
        // idempotency: don't duplicate
        if (eventId != null) {
            List<Notification> existing = repo.findByUserIdAndEventId(userId, eventId);
            if (!existing.isEmpty()) return existing.get(0);
        }
        Notification n = new Notification();
        n.setId("n" + UUID.randomUUID().toString().substring(0, 8));
        n.setUserId(userId);
        n.setType(type == null ? "SYSTEM" : type);
        n.setMessage(message);
        n.setEventId(eventId);
        n.setRead(false);
        return repo.save(n);
    }

    @Transactional
    public Notification markRead(String id, boolean read) {
        Notification n = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        n.setRead(read);
        return repo.save(n);
    }

    @Transactional
    public void markAllRead(String userId) { repo.markAllRead(userId); }

    public void delete(String id) { repo.deleteById(id); }

    @Transactional
    public void clearAll(String userId) { repo.deleteAllByUserId(userId); }
}
