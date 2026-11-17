package com.smartcampus.engagement.controller;

import com.smartcampus.engagement.domain.Event;
import com.smartcampus.engagement.service.EventService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
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
        return service.list(category,
                from == null ? null : Instant.parse(from),
                to == null ? null : Instant.parse(to));
    }

    @GetMapping("/events/{id}")
    public Event get(@PathVariable String id) { return service.get(id); }

    @PostMapping("/events")
    public Event create(@RequestBody Map<String, Object> body) {
        return service.create(
                (String) body.get("title"),
                (String) body.get("description"),
                (String) body.get("category"),
                Instant.parse((String) body.get("date")),
                (String) body.get("location"),
                ((Number) body.getOrDefault("capacity", 0)).intValue(),
                (String) body.get("organizerId"));
    }

    @PutMapping("/events/{id}")
    public Event update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return service.update(
                id,
                (String) body.get("title"),
                (String) body.get("description"),
                (String) body.get("category"),
                body.get("date") == null ? null : Instant.parse((String) body.get("date")),
                (String) body.get("location"),
                body.get("capacity") == null ? null : ((Number) body.get("capacity")).intValue());
    }

    @DeleteMapping("/events/{id}")
    public void delete(@PathVariable String id) { service.delete(id); }

    @GetMapping("/events/{id}/interest")
    public Map<String, Object> interestStatus(@PathVariable String id, @RequestParam String userId) {
        return Map.of("interested", service.isInterested(id, userId));
    }

    @PutMapping("/events/{id}/interest")
    public Map<String, Object> toggleInterest(@PathVariable String id, @RequestParam String userId) {
        boolean now = service.toggleInterest(id, userId);
        return Map.of("interested", now);
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
}
