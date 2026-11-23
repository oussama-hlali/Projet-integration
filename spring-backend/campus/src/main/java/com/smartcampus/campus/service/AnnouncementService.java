package com.smartcampus.campus.service;

import com.smartcampus.campus.domain.Announcement;
import com.smartcampus.campus.repository.AnnouncementRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AnnouncementService {
    private final AnnouncementRepository repo;
    public AnnouncementService(AnnouncementRepository repo) { this.repo = repo; }

    public List<Announcement> list() { return repo.findAllByOrderByPinnedDescCreatedAtDesc(); }

    public Announcement get(String id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found"));
    }

    @Transactional
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

    @Transactional
    public Announcement update(String id, String title, String body, String category, Boolean pinned) {
        Announcement a = get(id);
        if (title != null) a.setTitle(title);
        if (body != null) a.setBody(body);
        if (category != null) a.setCategory(category);
        if (pinned != null) a.setPinned(pinned);
        return repo.save(a);
    }

    @Transactional
    public void delete(String id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found");
        }
        repo.deleteById(id);
    }
}
