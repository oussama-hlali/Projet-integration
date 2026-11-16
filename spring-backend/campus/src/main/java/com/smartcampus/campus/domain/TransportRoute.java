package com.smartcampus.campus.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "transport_routes", schema = "campus")
public class TransportRoute {
    @Id
    @Column(length = 64)
    private String id;
    @Column(length = 120, nullable = false)
    private String name;
    @Column(length = 16)
    private String color;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
