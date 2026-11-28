package com.smartcampus.engagement.controller;

import com.smartcampus.engagement.domain.LostFoundComment;
import com.smartcampus.engagement.domain.LostFoundItem;
import com.smartcampus.engagement.service.LostFoundService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class LostFoundController {
    /** ~1.5 Mo de JPEG en base64 : assez pour une photo, sans gonfler la base. */
    private static final int MAX_PHOTO_CHARS = 2_000_000;

    private final LostFoundService service;
    public LostFoundController(LostFoundService service) { this.service = service; }

    @GetMapping("/lost-found")
    public List<LostFoundItem> list(@RequestParam(required = false) String status,
                                    @RequestParam(required = false) String q) {
        return service.list(status, q);
    }

    @GetMapping("/lost-found/{id}")
    public LostFoundItem get(@PathVariable String id) { return service.get(id); }

    @PostMapping("/lost-found")
    public LostFoundItem create(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> tags = (List<String>) body.get("taggedUserIds");
        String status = optional(body.get("status"));
        if (status == null) status = "LOST";
        if (!List.of("LOST", "FOUND").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        }
        String photoData = photo(body.get("photoData"));
        return service.create(
                required(body.get("title"), "title", 160),
                optional(body.get("description")),
                status,
                required(body.get("reporterId"), "reporterId", 64),
                optional(body.get("location")),
                optional(body.get("category")),
                optional(body.get("contactPhone")),
                tags,
                photoData);
    }

    @PatchMapping("/lost-found/{id}")
    public LostFoundItem updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || !List.of("LOST", "FOUND", "CLAIMED").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        }
        return service.setStatus(id, status);
    }

    @PostMapping("/lost-found/{id}/claim")
    public LostFoundItem claim(@PathVariable String id) { return service.claim(id); }

    @DeleteMapping("/lost-found/{id}")
    public void delete(@PathVariable String id) { service.delete(id); }

    @PutMapping("/lost-found/{id}/reactions/me")
    public Map<String, Object> addReaction(@PathVariable String id, @RequestParam String userId) {
        service.toggleReaction(id, userId); // idempotent-ish: ensure present
        LostFoundItem p = service.get(id);
        return Map.of("reacted", p.getReactionUserIds().contains(userId));
    }

    @DeleteMapping("/lost-found/{id}/reactions/me")
    public void removeReaction(@PathVariable String id, @RequestParam String userId) {
        LostFoundItem p = service.get(id);
        if (p.getReactionUserIds().contains(userId)) {
            service.toggleReaction(id, userId);
        }
    }

    @PostMapping("/lost-found/{id}/comments")
    public LostFoundComment addComment(@PathVariable String id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> tags = (List<String>) body.get("taggedUserIds");
        return service.addComment(
                id,
                required(body.get("authorId"), "authorId", 64),
                required(body.get("message"), "message", 1000),
                tags);
    }

    @GetMapping("/lost-found/{id}/comments")
    public List<LostFoundComment> comments(@PathVariable String id) { return service.comments(id); }

    private String required(Object raw, String field, int maxLength) {
        String text = optional(raw);
        if (text == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        if (text.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is too long");
        }
        return text;
    }

    private String optional(Object raw) {
        if (raw == null) return null;
        String text = String.valueOf(raw).trim();
        return text.isEmpty() ? null : text;
    }

    /** Base64 JPEG sans préfixe "data:" ; on refuse les valeurs absurdes. */
    private String photo(Object raw) {
        String data = optional(raw);
        if (data == null) return null;
        if (data.length() > MAX_PHOTO_CHARS || !data.matches("[A-Za-z0-9+/=]+")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid photoData");
        }
        return data;
    }
}
