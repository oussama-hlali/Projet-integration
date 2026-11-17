package com.smartcampus.engagement.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lost_found_comments", schema = "engagement")
public class LostFoundComment {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "post_id", length = 64, nullable = false)
    private String postId;
    @Column(name = "author_id", length = 64, nullable = false)
    private String authorId;
    @Column(length = 1000, nullable = false)
    private String message;
    @ElementCollection
    @CollectionTable(name = "lost_found_comment_tags", schema = "engagement",
            joinColumns = @JoinColumn(name = "comment_id"))
    @Column(name = "user_id", length = 64)
    private List<String> taggedUserIds = new ArrayList<>();
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPostId() { return postId; }
    public void setPostId(String postId) { this.postId = postId; }
    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public List<String> getTaggedUserIds() { return taggedUserIds; }
    public void setTaggedUserIds(List<String> taggedUserIds) { this.taggedUserIds = taggedUserIds; }
    public Instant getCreatedAt() { return createdAt; }
}
