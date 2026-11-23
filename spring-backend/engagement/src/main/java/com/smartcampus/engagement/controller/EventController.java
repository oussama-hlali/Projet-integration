package com.smartcampus.engagement.controller;

import com.smartcampus.engagement.domain.Event;
import com.smartcampus.engagement.service.EventService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class EventController {
    private final EventService service;
    public EventController(EventService service) { this.service = service; }

    @GetMapping("/events")
    public List<Event> list(@RequestParam(required = false) String category,
                            @RequestParam(required = false) String from,
                            @RequestParam(required = false) String to) {
        return service.list(category, parseInstant(from, "from"), parseInstant(to, "to"));
    }

    @GetMapping("/events/{id}")
    public Event get(@PathVariable String id) { return service.get(id); }

    @PostMapping("/events")
    public Event create(@RequestBody Map<String, Object> body) {
        return service.create(
                requireText(body.get("title"), "title", 160, true),
                requireText(body.get("description"), "description", 2000, false),
                requireText(body.get("category"), "category", 32, false),
                parseInstant(requiredText(body.get("date"), "date"), "date"),
                parseInstant(optionalText(body.get("endDate")), "endDate"),
                requireText(body.get("location"), "location", 160, false),
                requireCapacity(body.get("capacity")),
                optionalText(body.get("organizerId")),
                optionalText(body.get("roomId")));
    }

    @PutMapping("/events/{id}")
    public Event update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return service.update(
                id,
                requireText(body.get("title"), "title", 160, false),
                requireText(body.get("description"), "description", 2000, false),
                requireText(body.get("category"), "category", 32, false),
                parseInstant(optionalText(body.get("date")), "date"),
                parseInstant(optionalText(body.get("endDate")), "endDate"),
                requireText(body.get("location"), "location", 160, false),
                body.get("capacity") == null ? null : requireCapacity(body.get("capacity")),
                optionalText(body.get("roomId")));
    }

    @DeleteMapping("/events/{id}")
    public void delete(@PathVariable String id) { service.delete(id); }

    @GetMapping("/events/{id}/interest")
    public Map<String, Object> interestStatus(@PathVariable String id, @RequestParam String userId) {
        return Map.of("interested", service.isInterested(id, userId));
    }

    @PutMapping("/events/{id}/interest")
    public Map<String, Object> toggleInterest(@PathVariable String id, @RequestParam String userId) {
        return Map.of("interested", service.toggleInterest(id, userId));
    }

    @DeleteMapping("/events/{id}/interest")
    public Map<String, Object> removeInterest(@PathVariable String id, @RequestParam String userId) {
        return Map.of("interested", !service.removeInterest(id, userId));
    }

    @GetMapping("/me/event-interests")
    public List<String> myInterests(@RequestParam String userId) {
        return service.interestedEventIds(userId);
    }

    @GetMapping("/events/for-you")
    public List<Event> forYou(@RequestParam String userId, @RequestParam(defaultValue = "6") int limit) {
        return service.forYou(userId, limit);
    }

    @GetMapping("/events/{id}/registrations/me")
    public Map<String, Object> myRegistration(@PathVariable String id, @RequestParam String userId) {
        var r = service.findRegistration(id, userId);
        return r == null ? Map.of("registered", false) : Map.of("registered", true, "qrCode", r.getQrCode());
    }

    @GetMapping("/events/{id}/registrations/count")
    public Map<String, Object> regCount(@PathVariable String id) {
        return Map.of("count", service.registrationCount(id));
    }

    @PostMapping("/events/{id}/registrations")
    public Map<String, Object> register(@PathVariable String id, @RequestParam String userId) {
        var r = service.register(id, userId);
        return Map.of("id", r.getId(), "qrCode", r.getQrCode());
    }

    @DeleteMapping("/events/{id}/registrations/me")
    public void unregister(@PathVariable String id, @RequestParam String userId) {
        service.unregister(id, userId);
    }

    private Instant parseInstant(String raw, String field) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Instant.parse(raw);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be an ISO date-time");
        }
    }

    private String requiredText(Object raw, String field) {
        String text = optionalText(raw);
        if (text == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return text;
    }

    private String optionalText(Object raw) {
        if (raw == null) return null;
        String text = String.valueOf(raw).trim();
        return text.isEmpty() ? null : text;
    }

    private String requireText(Object raw, String field, int maxLength, boolean required) {
        String text = optionalText(raw);
        if (text == null) {
            if (required) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
            return null;
        }
        if (text.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is too long");
        }
        return text;
    }

    private int requireCapacity(Object raw) {
        if (!(raw instanceof Number number) || number.intValue() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "capacity must be a positive number");
        }
        return number.intValue();
    }
}
