package com.smartcampus.campus.controller;

import com.smartcampus.campus.domain.Reservation;
import com.smartcampus.campus.domain.ReservationStatus;
import com.smartcampus.campus.service.ReservationService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class ReservationController {
    private final ReservationService service;
    public ReservationController(ReservationService service) { this.service = service; }

    @GetMapping("/reservations")
    public List<Reservation> list(@RequestParam(required = false) String userId,
                                 @RequestParam(required = false) String status) {
        if (userId != null) return service.forUser(userId);
        return service.all();
    }

    @GetMapping("/reservations/{id}")
    public Reservation get(@PathVariable String id) { return service.get(id); }

    @PostMapping("/reservations")
    public Reservation create(@RequestBody Map<String, Object> body) {
        return service.create(
                (String) body.get("roomId"),
                (String) body.get("userId"),
                Instant.parse((String) body.get("startTime")),
                Instant.parse((String) body.get("endTime")),
                (String) body.get("purpose"));
    }

    @PostMapping("/reservations/{id}/confirm")
    public Reservation confirm(@PathVariable String id) { return service.confirm(id); }

    @PostMapping("/reservations/{id}/cancel")
    public Reservation cancel(@PathVariable String id) { return service.cancel(id); }

    @PostMapping("/reservations/{id}/complete")
    public Reservation complete(@PathVariable String id) { return service.complete(id); }
}
