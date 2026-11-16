package com.smartcampus.campus.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "rooms", schema = "campus")
public class Room {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "building_id", length = 64, nullable = false)
    private String buildingId;
    @Column(length = 120, nullable = false)
    private String name;
    @Column(nullable = false)
    private int capacity;
    @Column(length = 32, nullable = false)
    private String status = "AVAILABLE"; // AVAILABLE, MAINTENANCE
    @Column(length = 32)
    private String type; // LECTURE, LAB, MEETING

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBuildingId() { return buildingId; }
    public void setBuildingId(String buildingId) { this.buildingId = buildingId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
