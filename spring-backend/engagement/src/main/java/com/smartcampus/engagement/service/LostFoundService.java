package com.smartcampus.engagement.service;

import com.smartcampus.engagement.domain.LostFoundComment;
import com.smartcampus.engagement.domain.LostFoundItem;
import com.smartcampus.engagement.repository.LostFoundCommentRepository;
import com.smartcampus.engagement.repository.LostFoundRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class LostFoundService {
    private final LostFoundRepository posts;
    private final LostFoundCommentRepository comments;

    public LostFoundService(LostFoundRepository posts, LostFoundCommentRepository comments) {
        this.posts = posts; this.comments = comments;
    }

    public List<LostFoundItem> list(String status, String q) { return posts.search(status, q); }

    public LostFoundItem get(String id) {
        return posts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    public LostFoundItem create(String title, String description, String status, String reporterId,
                               java.util.List<String> taggedUserIds) {
        LostFoundItem p = new LostFoundItem();
        p.setId("lf" + UUID.randomUUID().toString().substring(0, 8));
        p.setTitle(title);
        p.setDescription(description);
        p.setStatus(status == null ? "LOST" : status);
        p.setReporterId(reporterId);
        if (taggedUserIds != null) p.setTaggedUserIds(new java.util.ArrayList<>(taggedUserIds));
        return posts.save(p);
    }

    public LostFoundItem setStatus(String id, String status) {
        LostFoundItem p = get(id);
        p.setStatus(status);
        return posts.save(p);
    }

    public LostFoundItem claim(String id) {
        LostFoundItem p = get(id);
        p.setStatus("CLAIMED");
        return posts.save(p);
    }

    public boolean toggleReaction(String id, String userId) {
        LostFoundItem p = get(id);
        List<String> reactions = p.getReactionUserIds();
        if (reactions.contains(userId)) {
            reactions.remove(userId);
            posts.save(p);
            return false;
        }
        reactions.add(userId);
        posts.save(p);
        return true;
    }

    public LostFoundComment addComment(String postId, String authorId, String message,
                                      java.util.List<String> taggedUserIds) {
        get(postId);
        LostFoundComment c = new LostFoundComment();
        c.setId("c" + UUID.randomUUID().toString().substring(0, 8));
        c.setPostId(postId);
        c.setAuthorId(authorId);
        c.setMessage(message);
        if (taggedUserIds != null) c.setTaggedUserIds(new java.util.ArrayList<>(taggedUserIds));
        return comments.save(c);
    }

    public List<LostFoundComment> comments(String postId) {
        return comments.findByPostIdOrderByCreatedAtAsc(postId);
    }

    public void delete(String id) { posts.deleteById(id); }
}
