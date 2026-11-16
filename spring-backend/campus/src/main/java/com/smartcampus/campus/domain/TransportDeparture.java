package com.smartcampus.campus.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalTime;

@Entity
@Table(name = "transport_departures", schema = "campus")
public class TransportDeparture {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "stop_id", length = 64, nullable = false)
    private String stopId;
    @Column(name = "departure_time", nullable = false)
    private LocalTime departureTime;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStopId() { return stopId; }
    public void setStopId(String stopId) { this.stopId = stopId; }
    public LocalTime getDepartureTime() { return departureTime; }
    public void setDepartureTime(LocalTime departureTime) { this.departureTime = departureTime; }
}
