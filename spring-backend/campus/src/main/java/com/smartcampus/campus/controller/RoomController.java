package com.smartcampus.campus.controller;

import com.smartcampus.campus.domain.Room;
import com.smartcampus.campus.service.RoomService;
import com.smartcampus.campus.service.ReservationService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class RoomController {
    private final RoomService service;
    private final ReservationService reservations;
    public RoomController(RoomService service, ReservationService reservations) { this.service = service; this.reservations = reservations; }

    @GetMapping("/rooms")
    public List<Room> search(@RequestParam(required = false) String buildingId,
                             @RequestParam(required = false) String status,
                             @RequestParam(required = false) String type,
                             @RequestParam(required = false) Integer minCapacity,
                             @RequestParam(required = false) String q) {
        return service.search(buildingId, status, type, minCapacity, q);
    }

    @GetMapping("/rooms/{id}")
    public Room get(@PathVariable String id) { return service.get(id); }

    @PostMapping("/rooms")
    public Room create(@RequestBody Map<String, Object> body) {
        return service.create(
                (String) body.get("buildingId"),
                (String) body.get("name"),
                ((Number) body.getOrDefault("capacity", 0)).intValue(),
                (String) body.get("type"),
                (String) body.get("status"));
    }

    @PutMapping("/rooms/{id}")
    public Room update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return service.update(
                id,
                (String) body.get("name"),
                body.get("capacity") == null ? null : ((Number) body.get("capacity")).intValue(),
                (String) body.get("type"),
                (String) body.get("status"));
    }

    @GetMapping("/rooms/{id}/availability")
    public Map<String, Object> availability(@PathVariable String id,
                                            @RequestParam String from,
                                            @RequestParam String to) {
        boolean available = reservations.isAvailable(id, Instant.parse(from), Instant.parse(to));
        return Map.of("roomId", id, "available", available);
    }

    @DeleteMapping("/rooms/{id}")
    public void delete(@PathVariable String id) { service.delete(id); }
}
