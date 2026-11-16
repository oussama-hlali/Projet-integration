package com.smartcampus.campus.repository;

import com.smartcampus.campus.domain.TransportDeparture;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransportDepartureRepository extends JpaRepository<TransportDeparture, String> {
    List<TransportDeparture> findByStopIdOrderByDepartureTimeAsc(String stopId);
}
