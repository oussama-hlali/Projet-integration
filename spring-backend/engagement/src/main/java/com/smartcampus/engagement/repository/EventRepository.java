package com.smartcampus.engagement.repository;

import com.smartcampus.engagement.domain.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, String> {
    @Query("SELECT e FROM Event e WHERE " +
           "(:category IS NULL OR e.category = :category) AND " +
           "(:from IS NULL OR e.date >= :from) AND " +
           "(:to IS NULL OR e.date <= :to)")
    List<Event> search(@Param("category") String category,
                       @Param("from") Instant from,
                       @Param("to") Instant to);
}
