package com.smartcampus.ai.service;

import com.smartcampus.ai.domain.AiProposal;
import com.smartcampus.ai.repository.AiProposalRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ProposalService {
    private final AiProposalRepository repo;
    public ProposalService(AiProposalRepository repo) { this.repo = repo; }

    public AiProposal create(String userId, String kind, String payload) {
        AiProposal p = new AiProposal();
        p.setId("prop" + UUID.randomUUID().toString().substring(0, 8));
        p.setUserId(userId);
        p.setKind(kind);
        p.setPayload(payload);
        p.setStatus("PENDING");
        p.setExpiresAt(Instant.now().plusSeconds(3600));
        return repo.save(p);
    }

    public AiProposal get(String id) { return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Proposal not found")); }

    public List<AiProposal> forUser(String userId) { return repo.findByUserIdOrderByCreatedAtDesc(userId); }

    public AiProposal confirm(String id) {
        AiProposal p = get(id);
        if (p.getExpiresAt().isBefore(Instant.now())) { p.setStatus("EXPIRED"); repo.save(p); throw new IllegalStateException("Proposal expired"); }
        p.setStatus("CONFIRMED");
        return repo.save(p);
    }

    public AiProposal reject(String id) {
        AiProposal p = get(id);
        p.setStatus("REJECTED");
        return repo.save(p);
    }
}
