package com.smartcampus.campus.service;

import com.smartcampus.campus.domain.Building;
import com.smartcampus.campus.repository.BuildingRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class BuildingService {
    private final BuildingRepository repo;
    public BuildingService(BuildingRepository repo) { this.repo = repo; }

    public List<Building> list() { return repo.findAll(); }
    public Building get(String id) { return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Building not found")); }
    public Building create(String name, String address) {
        Building b = new Building();
        b.setId("b" + UUID.randomUUID().toString().substring(0, 8));
        b.setName(name);
        b.setAddress(address);
        return repo.save(b);
    }
    public Building update(String id, String name, String address) {
        Building b = get(id);
        if (name != null) b.setName(name);
        if (address != null) b.setAddress(address);
        return repo.save(b);
    }
    public void delete(String id) { repo.deleteById(id); }
}
