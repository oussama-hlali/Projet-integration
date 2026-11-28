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
@Table(name = "lost_found", schema = "engagement")
public class LostFoundItem {
    @Id
    @Column(length = 64)
    private String id;
    @Column(length = 160, nullable = false)
    private String title;
    @Column(length = 2000)
    private String description;
    @Column(length = 16, nullable = false)
    private String status = "LOST"; // LOST, FOUND, CLAIMED
    @Column(length = 120)
    private String location;
    @Column(length = 64)
    private String category;
    @Column(name = "contact_phone", length = 32)
    private String contactPhone;
    @Column(name = "reporter_id", length = 64, nullable = false)
    private String reporterId;
    @ElementCollection
    @CollectionTable(name = "lost_found_tags", schema = "engagement",
            joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "user_id", length = 64)
    private List<String> taggedUserIds = new ArrayList<>();
    @ElementCollection
    @CollectionTable(name = "lost_found_reactions", schema = "engagement",
            joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "user_id", length = 64)
    private List<String> reactionUserIds = new ArrayList<>();
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "photo_data", columnDefinition = "text")
    private String photoData;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getReporterId() { return reporterId; }
    public void setReporterId(String reporterId) { this.reporterId = reporterId; }
    public List<String> getTaggedUserIds() { return taggedUserIds; }
    public void setTaggedUserIds(List<String> taggedUserIds) { this.taggedUserIds = taggedUserIds; }
    public List<String> getReactionUserIds() { return reactionUserIds; }
    public void setReactionUserIds(List<String> reactionUserIds) { this.reactionUserIds = reactionUserIds; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getPhotoData() { return photoData; }
    public void setPhotoData(String photoData) { this.photoData = photoData; }
}
