package com.smartcampus.ai.repository;

import com.smartcampus.ai.domain.AiUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiUsageRepository extends JpaRepository<AiUsage, String> {}
