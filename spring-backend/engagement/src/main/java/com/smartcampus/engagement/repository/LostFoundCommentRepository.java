package com.smartcampus.engagement.repository;

import com.smartcampus.engagement.domain.LostFoundComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LostFoundCommentRepository extends JpaRepository<LostFoundComment, String> {
    List<LostFoundComment> findByPostIdOrderByCreatedAtAsc(String postId);
}
