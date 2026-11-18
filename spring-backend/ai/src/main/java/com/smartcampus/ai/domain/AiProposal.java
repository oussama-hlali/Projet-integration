package com.smartcampus.ai.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "ai_proposals", schema = "ai")
public class AiProposal {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;
    @Column(length = 64, nullable = false)
    private String kind; // CREATE_RESERVATION, CREATE_ANNOUNCEMENT, ...
    @Column(length = 2000, nullable = false)
    private String payload;
    @Column(length = 16, nullable = false)
    private String status = "PENDING"; // PENDING, CONFIRMED, REJECTED, EXPIRED
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getCreatedAt() { return createdAt; }
}
