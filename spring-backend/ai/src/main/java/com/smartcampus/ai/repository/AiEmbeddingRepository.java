package com.smartcampus.ai.repository;

import com.smartcampus.ai.domain.AiEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiEmbeddingRepository extends JpaRepository<AiEmbedding, String> {
    List<AiEmbedding> findBySourceType(String sourceType);
}
