package com.smartcampus.campus.repository;

import com.smartcampus.campus.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RoomRepository extends JpaRepository<Room, String>, JpaSpecificationExecutor<Room> {
}
