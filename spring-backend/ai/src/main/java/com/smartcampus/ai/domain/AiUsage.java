package com.smartcampus.ai.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "ai_usage", schema = "ai")
public class AiUsage {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;
    @Column(nullable = false)
    private int tokens;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public int getTokens() { return tokens; }
    public void setTokens(int tokens) { this.tokens = tokens; }
    public Instant getCreatedAt() { return createdAt; }
}
