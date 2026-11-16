package com.smartcampus.campus.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "transport_stops", schema = "campus")
public class TransportStop {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "route_id", length = 64, nullable = false)
    private String routeId;
    @Column(length = 120, nullable = false)
    private String name;
    @Column(nullable = false)
    private int sequence;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRouteId() { return routeId; }
    public void setRouteId(String routeId) { this.routeId = routeId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getSequence() { return sequence; }
    public void setSequence(int sequence) { this.sequence = sequence; }
}
