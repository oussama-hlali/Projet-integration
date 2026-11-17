package com.smartcampus.engagement.repository;

import com.smartcampus.engagement.domain.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, String> {
    Optional<EventRegistration> findByEventIdAndUserId(String eventId, String userId);
    long countByEventId(String eventId);
}
