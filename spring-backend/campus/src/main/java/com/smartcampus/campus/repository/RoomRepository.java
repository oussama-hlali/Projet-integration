package com.smartcampus.campus.repository;

import com.smartcampus.campus.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, String> {
    @Query("SELECT r FROM Room r WHERE " +
           "(:buildingId IS NULL OR r.buildingId = :buildingId) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:type IS NULL OR r.type = :type) AND " +
           "(:minCapacity IS NULL OR r.capacity >= :minCapacity) AND " +
           "(:q IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Room> search(@Param("buildingId") String buildingId,
                      @Param("status") String status,
                      @Param("type") String type,
                      @Param("minCapacity") Integer minCapacity,
                      @Param("q") String q);
}
