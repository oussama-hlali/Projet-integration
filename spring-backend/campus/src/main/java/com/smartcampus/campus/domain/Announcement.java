package com.smartcampus.campus.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "announcements", schema = "campus")
public class Announcement {
    @Id
    @Column(length = 64)
    private String id;
    @Column(length = 160, nullable = false)
    private String title;
    @Column(length = 2000, nullable = false)
    private String body;
    @Column(length = 32, nullable = false)
    private String category = "GENERAL";
    @Column(nullable = false)
    private boolean pinned;
    @Column(name = "author_id", length = 64)
    private String authorId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public boolean isPinned() { return pinned; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }
    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
