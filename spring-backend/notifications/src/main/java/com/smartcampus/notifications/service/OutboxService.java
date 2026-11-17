package com.smartcampus.notifications.service;

import com.smartcampus.notifications.domain.OutboxEvent;
import com.smartcampus.notifications.repository.OutboxEventRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class OutboxService {
    private final OutboxEventRepository outbox;
    private final NotificationService notifications;

    public OutboxService(OutboxEventRepository outbox, NotificationService notifications) {
        this.outbox = outbox; this.notifications = notifications;
    }

    public OutboxEvent publish(String aggregateType, String aggregateId, String eventType, String payload) {
        OutboxEvent e = new OutboxEvent();
        e.setId("ob" + UUID.randomUUID().toString().substring(0, 8));
        e.setAggregateType(aggregateType);
        e.setAggregateId(aggregateId);
        e.setEventType(eventType);
        e.setPayload(payload);
        e.setStatus("PENDING");
        return outbox.save(e);
    }

    // Dispatcher: every 10s, process pending outbox events into notifications.
    @Scheduled(fixedRate = 10_000)
    @Transactional
    public void dispatch() {
        List<OutboxEvent> pending = outbox.findByStatusOrderByCreatedAtAsc("PENDING");
        for (OutboxEvent e : pending) {
            try {
                // payload format: "userId|type|message|eventId"
                String[] parts = e.getPayload().split("\\|", 4);
                String userId = parts.length > 0 ? parts[0] : null;
                String type = parts.length > 1 ? parts[1] : "SYSTEM";
                String message = parts.length > 2 ? parts[2] : e.getEventType();
                String eventId = parts.length > 3 ? parts[3] : e.getId();
                if (userId != null) {
                    notifications.ingest(userId, type, message, eventId);
                }
                e.setStatus("SENT");
                e.setSentAt(Instant.now());
            } catch (Exception ex) {
                e.setStatus("FAILED");
                e.setRetries(e.getRetries() + 1);
                // retry: move back to PENDING if under 5 retries
                if (e.getRetries() < 5) e.setStatus("PENDING");
            }
            outbox.save(e);
        }
    }
}
