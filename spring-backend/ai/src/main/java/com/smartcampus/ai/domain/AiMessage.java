package com.smartcampus.ai.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "ai_messages", schema = "ai")
public class AiMessage {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;
    @Column(length = 16, nullable = false)
    private String role; // user, assistant
    @Column(length = 4000, nullable = false)
    private String content;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Instant getCreatedAt() { return createdAt; }
}
