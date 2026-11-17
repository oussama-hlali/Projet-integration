package com.smartcampus.engagement.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "events", schema = "engagement")
public class Event {
    @Id
    @Column(length = 64)
    private String id;
    @Column(length = 160, nullable = false)
    private String title;
    @Column(length = 2000)
    private String description;
    @Column(length = 32, nullable = false)
    private String category; // ACADEMIC, SOCIAL, SPORT, CULTURE, CAREER
    @Column(nullable = false)
    private Instant date;
    @Column(length = 160)
    private String location;
    @Column(nullable = false)
    private int capacity;
    @Column(name = "organizer_id", length = 64)
    private String organizerId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Instant getDate() { return date; }
    public void setDate(Instant date) { this.date = date; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    public String getOrganizerId() { return organizerId; }
    public void setOrganizerId(String organizerId) { this.organizerId = organizerId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
