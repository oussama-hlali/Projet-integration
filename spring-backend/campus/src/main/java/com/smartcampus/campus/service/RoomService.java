package com.smartcampus.campus.service;

import com.smartcampus.campus.domain.Room;
import com.smartcampus.campus.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class RoomService {
    private final RoomRepository repo;
    public RoomService(RoomRepository repo) { this.repo = repo; }

    public List<Room> search(String buildingId, String status, String type, Integer minCapacity, String q) {
        return repo.search(buildingId, status, type, minCapacity, q);
    }
    public Room get(String id) { return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Room not found")); }
    public Room create(String buildingId, String name, int capacity, String type, String status) {
        Room r = new Room();
        r.setId("r" + UUID.randomUUID().toString().substring(0, 8));
        r.setBuildingId(buildingId);
        r.setName(name);
        r.setCapacity(capacity);
        r.setType(type);
        r.setStatus(status == null ? "AVAILABLE" : status);
        return repo.save(r);
    }
    public Room update(String id, String name, Integer capacity, String type, String status) {
        Room r = get(id);
        if (name != null) r.setName(name);
        if (capacity != null) r.setCapacity(capacity);
        if (type != null) r.setType(type);
        if (status != null) r.setStatus(status);
        return repo.save(r);
    }
    public void delete(String id) { repo.deleteById(id); }
}
