package com.smartcampus.engagement.controller;

import com.smartcampus.engagement.domain.LostFoundComment;
import com.smartcampus.engagement.domain.LostFoundItem;
import com.smartcampus.engagement.service.LostFoundService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class LostFoundController {
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
        return service.create(
                (String) body.get("title"),
                (String) body.get("description"),
                (String) body.get("status"),
                (String) body.get("reporterId"),
                tags);
    }

    @PatchMapping("/lost-found/{id}")
    public LostFoundItem updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return service.setStatus(id, body.get("status"));
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
        return service.addComment(id, (String) body.get("authorId"), (String) body.get("message"), tags);
    }

    @GetMapping("/lost-found/{id}/comments")
    public List<LostFoundComment> comments(@PathVariable String id) { return service.comments(id); }
}
