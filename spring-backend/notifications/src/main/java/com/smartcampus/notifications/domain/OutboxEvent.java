package com.smartcampus.notifications.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "outbox", schema = "notifications")
public class OutboxEvent {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "aggregate_type", length = 64, nullable = false)
    private String aggregateType;
    @Column(name = "aggregate_id", length = 64, nullable = false)
    private String aggregateId;
    @Column(name = "event_type", length = 64, nullable = false)
    private String eventType;
    @Column(length = 2000, nullable = false)
    private String payload;
    @Column(length = 16, nullable = false)
    private String status = "PENDING"; // PENDING, SENT, FAILED
    @Column(nullable = false)
    private int retries;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "sent_at")
    private Instant sentAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAggregateType() { return aggregateType; }
    public void setAggregateType(String aggregateType) { this.aggregateType = aggregateType; }
    public String getAggregateId() { return aggregateId; }
    public void setAggregateId(String aggregateId) { this.aggregateId = aggregateId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getRetries() { return retries; }
    public void setRetries(int retries) { this.retries = retries; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
}
