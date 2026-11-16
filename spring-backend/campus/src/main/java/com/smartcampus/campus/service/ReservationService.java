package com.smartcampus.campus.service;

import com.smartcampus.campus.domain.Reservation;
import com.smartcampus.campus.domain.ReservationStatus;
import com.smartcampus.campus.domain.Room;
import com.smartcampus.campus.repository.ReservationRepository;
import com.smartcampus.campus.repository.RoomRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ReservationService {
    private final ReservationRepository repo;
    private final RoomRepository rooms;

    public ReservationService(ReservationRepository repo, RoomRepository rooms) {
        this.repo = repo;
        this.rooms = rooms;
    }

    @Transactional
    public Reservation create(String roomId, String userId, Instant start, Instant end, String purpose) {
        Room room = rooms.findById(roomId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        if (room.getStatus().equals("MAINTENANCE")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ROOM_UNAVAILABLE");
        }
        if (repo.hasConflict(roomId, start, end)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RESERVATION_CONFLICT");
        }
        Reservation r = new Reservation();
        r.setId("res" + UUID.randomUUID().toString().substring(0, 8));
        r.setRoomId(roomId);
        r.setRoomName(room.getName());
        r.setUserId(userId);
        r.setStartTime(start);
        r.setEndTime(end);
        r.setPurpose(purpose);
        r.setStatus(ReservationStatus.PENDING);
        try {
            return repo.save(r);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RESERVATION_CONFLICT");
        }
    }

    public Reservation get(String id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
    }

    @Transactional
    public Reservation confirm(String id) {
        Reservation r = get(id);
        if (r.getStatus() != ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "INVALID_STATE");
        }
        r.setStatus(ReservationStatus.CONFIRMED);
        return repo.save(r);
    }

    @Transactional
    public Reservation cancel(String id) {
        Reservation r = get(id);
        if (r.getStatus() == ReservationStatus.COMPLETED || r.getStatus() == ReservationStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "INVALID_STATE");
        }
        r.setStatus(ReservationStatus.CANCELLED);
        return repo.save(r);
    }

    @Transactional
    public Reservation complete(String id) {
        Reservation r = get(id);
        r.setStatus(ReservationStatus.COMPLETED);
        return repo.save(r);
    }

    public List<Reservation> forUser(String userId) { return repo.findByUserIdOrderByStartTimeDesc(userId); }
    public List<Reservation> all() { return repo.findAll(); }
    public boolean isAvailable(String roomId, Instant start, Instant end) {
        return !repo.hasConflict(roomId, start, end);
    }

    // Auto-complete: every 5 minutes, mark confirmed reservations whose end time passed.
    @Scheduled(fixedRate = 300_000)
    @Transactional
    public void autoComplete() {
        List<Reservation> overdue = repo.findByStatusAndEndTimeBefore(ReservationStatus.CONFIRMED, Instant.now());
        for (Reservation r : overdue) {
            r.setStatus(ReservationStatus.COMPLETED);
            repo.save(r);
        }
    }
}
