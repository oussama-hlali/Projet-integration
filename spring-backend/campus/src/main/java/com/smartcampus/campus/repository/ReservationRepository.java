package com.smartcampus.campus.repository;

import com.smartcampus.campus.domain.Reservation;
import com.smartcampus.campus.domain.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, String> {
    List<Reservation> findByUserIdOrderByStartTimeDesc(String userId);

    @Query("SELECT COUNT(r) > 0 FROM Reservation r WHERE r.roomId = :roomId " +
           "AND r.status IN (com.smartcampus.campus.domain.ReservationStatus.PENDING, com.smartcampus.campus.domain.ReservationStatus.CONFIRMED) " +
           "AND r.startTime < :end AND r.endTime > :start")
    boolean hasConflict(@Param("roomId") String roomId,
                        @Param("start") Instant start,
                        @Param("end") Instant end);

    List<Reservation> findByStatusAndEndTimeBefore(ReservationStatus status, Instant before);
}
