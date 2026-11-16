package com.smartcampus.campus.repository;

import com.smartcampus.campus.domain.TransportStop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransportStopRepository extends JpaRepository<TransportStop, String> {
    List<TransportStop> findByRouteIdOrderBySequenceAsc(String routeId);
}
