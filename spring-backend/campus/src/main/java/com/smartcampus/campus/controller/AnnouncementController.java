package com.smartcampus.campus.controller;

import com.smartcampus.campus.domain.Announcement;
import com.smartcampus.campus.service.AnnouncementService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
        String title = requireText(body.get("title"), "title", 160, true);
        String content = requireText(body.get("body"), "body", 2000, true);
        String category = requireText(body.get("category"), "category", 32, false);
        return service.create(
                title,
                content,
                category,
                Boolean.TRUE.equals(body.get("pinned")),
                (String) body.get("authorId"));
    }

    @PutMapping("/announcements/{id}")
    public Announcement update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return service.update(
                id,
                requireText(body.get("title"), "title", 160, false),
                requireText(body.get("body"), "body", 2000, false),
                requireText(body.get("category"), "category", 32, false),
                body.get("pinned") == null ? null : Boolean.valueOf(body.get("pinned").toString()));
    }

    @DeleteMapping("/announcements/{id}")
    public void delete(@PathVariable String id) { service.delete(id); }

    /** Reject bad payloads here instead of letting a DB constraint surface as 500. */
    private String requireText(Object raw, String field, int maxLength, boolean required) {
        if (raw == null) {
            if (required) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
            }
            return null;
        }
        if (!(raw instanceof String text) || text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must not be blank");
        }
        if (text.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is too long");
        }
        return text.trim();
    }
}
