package com.smartcampus.campus.controller;

import com.smartcampus.campus.domain.Building;
import com.smartcampus.campus.service.BuildingService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class BuildingController {
    private final BuildingService service;
    public BuildingController(BuildingService service) { this.service = service; }

    @GetMapping("/buildings")
    public List<Building> list() { return service.list(); }

    @GetMapping("/buildings/{id}")
    public Building get(@PathVariable String id) { return service.get(id); }

    @PostMapping("/buildings")
    public Building create(@RequestBody Map<String, String> body) {
        return service.create(body.get("name"), body.get("address"));
    }

    @PutMapping("/buildings/{id}")
    public Building update(@PathVariable String id, @RequestBody Map<String, String> body) {
        return service.update(id, body.get("name"), body.get("address"));
    }

    @DeleteMapping("/buildings/{id}")
    public void delete(@PathVariable String id) { service.delete(id); }
}
