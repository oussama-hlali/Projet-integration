package com.smartcampus.campus.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "buildings", schema = "campus")
public class Building {
    @Id
    @Column(length = 64)
    private String id;
    @Column(length = 120, nullable = false)
    private String name;
    @Column(length = 200)
    private String address;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
