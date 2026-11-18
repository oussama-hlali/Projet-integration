package com.smartcampus.notifications.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "notifications", schema = "notifications")
public class Notification {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;
    @Column(length = 32, nullable = false)
    private String type; // ANNOUNCEMENT, EVENT, RESERVATION, LOST_FOUND, SYSTEM
    @Column(length = 500, nullable = false)
    private String message;
    @Column(name = "event_id", length = 64)
    private String eventId; // external id for idempotency
    @Column(nullable = false)
    private boolean read;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public Instant getCreatedAt() { return createdAt; }
}
