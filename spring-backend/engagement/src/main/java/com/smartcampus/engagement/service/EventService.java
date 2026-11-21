package com.smartcampus.engagement.service;

import com.smartcampus.engagement.domain.Event;
import com.smartcampus.engagement.domain.EventInterest;
import com.smartcampus.engagement.domain.EventRegistration;
import com.smartcampus.engagement.repository.EventInterestRepository;
import com.smartcampus.engagement.repository.EventRegistrationRepository;
import com.smartcampus.engagement.repository.EventRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EventService {
    private final EventRepository events;
    private final EventInterestRepository interests;
    private final EventRegistrationRepository registrations;

    public EventService(EventRepository events, EventInterestRepository interests,
                        EventRegistrationRepository registrations) {
        this.events = events; this.interests = interests; this.registrations = registrations;
    }

    public List<Event> list(String category, Instant from, Instant to) {
        Specification<Event> spec = Specification.where(null);
        if (category != null && !category.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category));
        }
        if (from != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.<Instant>get("date"), from));
        }
        if (to != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.<Instant>get("date"), to));
        }
        return events.findAll(spec);
    }

    public Event get(String id) {
        return events.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }

    public Event create(String title, String description, String category, Instant date,
                        String location, int capacity, String organizerId) {
        Event e = new Event();
        e.setId("e" + UUID.randomUUID().toString().substring(0, 8));
        e.setTitle(title);
        e.setDescription(description);
        e.setCategory(category == null ? "ACADEMIC" : category);
        e.setDate(date);
        e.setLocation(location);
        e.setCapacity(capacity);
        e.setOrganizerId(organizerId);
        return events.save(e);
    }

    public Event update(String id, String title, String description, String category, Instant date,
                        String location, Integer capacity) {
        Event e = get(id);
        if (title != null) e.setTitle(title);
        if (description != null) e.setDescription(description);
        if (category != null) e.setCategory(category);
        if (date != null) e.setDate(date);
        if (location != null) e.setLocation(location);
        if (capacity != null) e.setCapacity(capacity);
        return events.save(e);
    }

    public void delete(String id) { events.deleteById(id); }

    // Interest toggle
    public boolean toggleInterest(String eventId, String userId) {
        get(eventId);
        var existing = interests.findByEventIdAndUserId(eventId, userId);
        if (existing.isPresent()) {
            interests.delete(existing.get());
            return false;
        }
        EventInterest i = new EventInterest();
        i.setId("ei" + UUID.randomUUID().toString().substring(0, 8));
        i.setEventId(eventId);
        i.setUserId(userId);
        interests.save(i);
        return true;
    }

    public boolean isInterested(String eventId, String userId) {
        return interests.existsByEventIdAndUserId(eventId, userId);
    }

    public List<String> interestedEventIds(String userId) {
        return interests.findByUserId(userId).stream().map(EventInterest::getEventId).toList();
    }

    // For-you ranking: events whose category matches the user's interested categories, soonest first.
    public List<Event> forYou(String userId, int limit) {
        Set<String> followedCategories = interests.findByUserId(userId).stream()
                .map(i -> get(i.getEventId()).getCategory())
                .collect(Collectors.toSet());
        Instant now = Instant.now();
        return events.findAll().stream()
                .filter(e -> e.getDate().isAfter(now))
                .sorted((a, b) -> {
                    int scoreA = followedCategories.contains(a.getCategory()) ? 0 : 1;
                    int scoreB = followedCategories.contains(b.getCategory()) ? 0 : 1;
                    if (scoreA != scoreB) return Integer.compare(scoreA, scoreB);
                    return a.getDate().compareTo(b.getDate());
                })
                .limit(limit)
                .toList();
    }

    // Registration with capacity lock
    @Transactional
    public EventRegistration register(String eventId, String userId) {
        Event e = get(eventId);
        if (registrations.findByEventIdAndUserId(eventId, userId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ALREADY_REGISTERED");
        }
        long count = registrations.countByEventId(eventId);
        if (count >= e.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EVENT_FULL");
        }
        EventRegistration r = new EventRegistration();
        r.setId("reg" + UUID.randomUUID().toString().substring(0, 8));
        r.setEventId(eventId);
        r.setUserId(userId);
        r.setQrCode("EVT-" + eventId + "-" + userId);
        try {
            return registrations.save(r);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ALREADY_REGISTERED");
        }
    }

    public boolean unregister(String eventId, String userId) {
        var r = registrations.findByEventIdAndUserId(eventId, userId);
        if (r.isEmpty()) return false;
        registrations.delete(r.get());
        return true;
    }

    public boolean isRegistered(String eventId, String userId) {
        return registrations.findByEventIdAndUserId(eventId, userId).isPresent();
    }

    public EventRegistration findRegistration(String eventId, String userId) {
        return registrations.findByEventIdAndUserId(eventId, userId).orElse(null);
    }

    public long registrationCount(String eventId) { return registrations.countByEventId(eventId); }
}
