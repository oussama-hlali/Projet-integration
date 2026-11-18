package com.smartcampus.ai.repository;

import com.smartcampus.ai.domain.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiMessageRepository extends JpaRepository<AiMessage, String> {
    List<AiMessage> findByUserIdOrderByCreatedAtAsc(String userId);
}
