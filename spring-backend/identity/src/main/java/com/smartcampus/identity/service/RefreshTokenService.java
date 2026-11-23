package com.smartcampus.identity.service;

import com.smartcampus.identity.domain.RefreshToken;
import com.smartcampus.identity.domain.User;
import com.smartcampus.identity.repository.RefreshTokenRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final int REFRESH_TTL_DAYS = 30;

    private final RefreshTokenRepository tokens;

    public RefreshTokenService(RefreshTokenRepository tokens) {
        this.tokens = tokens;
    }

    public RefreshToken issue(String userId) {
        RefreshToken t = new RefreshToken();
        t.setId(UUID.randomUUID().toString());
        t.setUserId(userId);
        t.setFamilyId(UUID.randomUUID().toString());
        t.setExpiresAt(Instant.now().plusSeconds(REFRESH_TTL_DAYS * 24 * 3600L));
        tokens.save(t);
        return t;
    }

    /** Rotates the token. If a revoked token is reused, revoke the whole family. */
    @Transactional
    public RefreshToken rotate(String presentedToken) {
        RefreshToken current = tokens.findById(presentedToken).orElse(null);
        if (current == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
        if (current.isRevoked()) {
            // reuse detected -> revoke entire family
            tokens.findByFamilyId(current.getFamilyId()).forEach(t -> t.setRevoked(true));
            tokens.saveAll(tokens.findByFamilyId(current.getFamilyId()));
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token reuse detected");
        }
        if (current.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        // revoke current, issue new one in the same family
        current.setRevoked(true);
        tokens.save(current);

        RefreshToken next = new RefreshToken();
        next.setId(UUID.randomUUID().toString());
        next.setUserId(current.getUserId());
        next.setFamilyId(current.getFamilyId());
        next.setExpiresAt(Instant.now().plusSeconds(REFRESH_TTL_DAYS * 24 * 3600L));
        tokens.save(next);
        return next;
    }

    public void revokeAllForUser(String userId) {
        tokens.deleteByUserId(userId);
    }

    @Transactional
    public void revoke(String tokenId) {
        tokens.findById(tokenId).ifPresent(t -> {
            t.setRevoked(true);
            tokens.save(t);
        });
    }
}
