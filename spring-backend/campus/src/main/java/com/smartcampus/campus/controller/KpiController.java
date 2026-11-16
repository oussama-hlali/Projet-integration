package com.smartcampus.campus.controller;

import com.smartcampus.campus.domain.ReservationStatus;
import com.smartcampus.campus.repository.AnnouncementRepository;
import com.smartcampus.campus.repository.ReservationRepository;
import com.smartcampus.campus.repository.RoomRepository;
import com.smartcampus.campus.repository.TransportRouteRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class KpiController {
    private final RoomRepository rooms;
    private final ReservationRepository reservations;
    private final AnnouncementRepository announcements;
    private final TransportRouteRepository routes;

    public KpiController(RoomRepository rooms, ReservationRepository reservations,
                         AnnouncementRepository announcements, TransportRouteRepository routes) {
        this.rooms = rooms; this.reservations = reservations;
        this.announcements = announcements; this.routes = routes;
    }

    @GetMapping("/campus/kpi")
    public Map<String, Object> kpi() {
        long roomsTotal = rooms.count();
        long roomsAvailable = rooms.findAll().stream().filter(r -> "AVAILABLE".equals(r.getStatus())).count();
        long reservationsTotal = reservations.count();
        long reservationsPending = reservations.findAll().stream().filter(r -> r.getStatus() == ReservationStatus.PENDING).count();
        long reservationsConfirmed = reservations.findAll().stream().filter(r -> r.getStatus() == ReservationStatus.CONFIRMED).count();
        long reservationsCancelled = reservations.findAll().stream().filter(r -> r.getStatus() == ReservationStatus.CANCELLED).count();
        long reservationsCompleted = reservations.findAll().stream().filter(r -> r.getStatus() == ReservationStatus.COMPLETED).count();
        return Map.of(
                "roomsTotal", roomsTotal,
                "roomsAvailable", roomsAvailable,
                "reservationsTotal", reservationsTotal,
                "reservationsPending", reservationsPending,
                "reservationsConfirmed", reservationsConfirmed,
                "reservationsCancelled", reservationsCancelled,
                "reservationsCompleted", reservationsCompleted,
                "announcementsTotal", announcements.count(),
                "transportRoutes", routes.count()
        );
    }
}
