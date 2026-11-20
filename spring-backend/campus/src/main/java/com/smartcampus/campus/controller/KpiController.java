package com.smartcampus.campus.controller;

import com.smartcampus.campus.domain.ReservationStatus;
import com.smartcampus.campus.repository.AnnouncementRepository;
import com.smartcampus.campus.repository.ReservationRepository;
import com.smartcampus.campus.repository.RoomRepository;
import com.smartcampus.campus.repository.TransportRouteRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
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
        var allRooms = rooms.findAll();
        Map<String, Object> kpi = new LinkedHashMap<>();
        kpi.put("roomsTotal", rooms.count());
        kpi.put("roomsAvailable", allRooms.stream().filter(r -> "AVAILABLE".equals(r.getStatus())).count());
        kpi.put("roomsOccupied", allRooms.stream().filter(r -> "OCCUPIED".equals(r.getStatus())).count());
        kpi.put("roomsReserved", allRooms.stream().filter(r -> "RESERVED".equals(r.getStatus())).count());
        kpi.put("roomsMaintenance", allRooms.stream().filter(r -> "MAINTENANCE".equals(r.getStatus())).count());
        kpi.put("reservationsTotal", reservations.count());
        kpi.put("reservationsPending", reservations.findAll().stream().filter(r -> r.getStatus() == ReservationStatus.PENDING).count());
        kpi.put("reservationsConfirmed", reservations.findAll().stream().filter(r -> r.getStatus() == ReservationStatus.CONFIRMED).count());
        kpi.put("reservationsCancelled", reservations.findAll().stream().filter(r -> r.getStatus() == ReservationStatus.CANCELLED).count());
        kpi.put("reservationsCompleted", reservations.findAll().stream().filter(r -> r.getStatus() == ReservationStatus.COMPLETED).count());
        kpi.put("announcementsTotal", announcements.count());
        kpi.put("transportRoutes", routes.count());
        return kpi;
    }
}
