package com.smartcampus.cafeteria.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "menus", schema = "cafeteria")
public class CafeteriaMenu {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "building_id", length = 64)
    private String buildingId;
    @Column(length = 120)
    private String building;
    @Column(nullable = false)
    private Instant date;
    @Column(length = 32)
    private String meal = "Lunch";
    @Column(name = "opening_hours", length = 32)
    private String openingHours;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBuildingId() { return buildingId; }
    public void setBuildingId(String buildingId) { this.buildingId = buildingId; }
    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }
    public Instant getDate() { return date; }
    public void setDate(Instant date) { this.date = date; }
    public String getMeal() { return meal; }
    public void setMeal(String meal) { this.meal = meal; }
    public String getOpeningHours() { return openingHours; }
    public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }
}
