package com.smartcampus.identity.repository;

import com.smartcampus.identity.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    Optional<RefreshToken> findByIdAndRevokedFalse(String id);
    List<RefreshToken> findByFamilyId(String familyId);
    void deleteByUserId(String userId);
}
