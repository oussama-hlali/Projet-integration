package com.smartcampus.campus.service;

import com.smartcampus.campus.domain.Announcement;
import com.smartcampus.campus.repository.AnnouncementRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AnnouncementService {
    private final AnnouncementRepository repo;
    public AnnouncementService(AnnouncementRepository repo) { this.repo = repo; }

    public List<Announcement> list() { return repo.findAllByOrderByPinnedDescCreatedAtDesc(); }
    public Announcement get(String id) { return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Announcement not found")); }
    public Announcement create(String title, String body, String category, boolean pinned, String authorId) {
        Announcement a = new Announcement();
        a.setId("a" + UUID.randomUUID().toString().substring(0, 8));
        a.setTitle(title);
        a.setBody(body);
        a.setCategory(category == null ? "GENERAL" : category);
        a.setPinned(pinned);
        a.setAuthorId(authorId);
        return repo.save(a);
    }
    public Announcement update(String id, String title, String body, String category, Boolean pinned) {
        Announcement a = get(id);
        if (title != null) a.setTitle(title);
        if (body != null) a.setBody(body);
        if (category != null) a.setCategory(category);
        if (pinned != null) a.setPinned(pinned);
        return repo.save(a);
    }
    public void delete(String id) { repo.deleteById(id); }
}
