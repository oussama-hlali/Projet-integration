package com.smartcampus.engagement.repository;

import com.smartcampus.engagement.domain.EventInterest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventInterestRepository extends JpaRepository<EventInterest, String> {
    Optional<EventInterest> findByEventIdAndUserId(String eventId, String userId);
    List<EventInterest> findByUserId(String userId);
    long countByEventId(String eventId);
    boolean existsByEventIdAndUserId(String eventId, String userId);
}
