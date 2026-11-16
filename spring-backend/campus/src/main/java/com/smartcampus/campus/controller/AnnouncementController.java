package com.smartcampus.campus.controller;

import com.smartcampus.campus.domain.Announcement;
import com.smartcampus.campus.service.AnnouncementService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class AnnouncementController {
    private final AnnouncementService service;
    public AnnouncementController(AnnouncementService service) { this.service = service; }

    @GetMapping("/announcements")
    public List<Announcement> list() { return service.list(); }

    @GetMapping("/announcements/{id}")
    public Announcement get(@PathVariable String id) { return service.get(id); }

    @PostMapping("/announcements")
    public Announcement create(@RequestBody Map<String, Object> body) {
        return service.create(
                (String) body.get("title"),
                (String) body.get("body"),
                (String) body.get("category"),
                Boolean.TRUE.equals(body.get("pinned")),
                (String) body.get("authorId"));
    }

    @PutMapping("/announcements/{id}")
    public Announcement update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return service.update(
                id,
                (String) body.get("title"),
                (String) body.get("body"),
                (String) body.get("category"),
                body.get("pinned") == null ? null : Boolean.valueOf(body.get("pinned").toString()));
    }

    @DeleteMapping("/announcements/{id}")
    public void delete(@PathVariable String id) { service.delete(id); }
}
