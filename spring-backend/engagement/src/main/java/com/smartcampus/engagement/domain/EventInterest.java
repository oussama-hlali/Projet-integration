package com.smartcampus.engagement.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "event_interests", schema = "engagement",
        uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "user_id"}))
public class EventInterest {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "event_id", length = 64, nullable = false)
    private String eventId;
    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Instant getCreatedAt() { return createdAt; }
}
