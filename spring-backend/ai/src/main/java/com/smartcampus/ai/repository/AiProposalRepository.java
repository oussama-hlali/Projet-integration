package com.smartcampus.ai.repository;

import com.smartcampus.ai.domain.AiProposal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiProposalRepository extends JpaRepository<AiProposal, String> {
    List<AiProposal> findByUserIdOrderByCreatedAtDesc(String userId);
}
