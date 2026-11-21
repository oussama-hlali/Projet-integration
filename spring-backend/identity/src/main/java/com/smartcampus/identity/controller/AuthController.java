package com.smartcampus.identity.controller;

import com.smartcampus.identity.domain.User;
import com.smartcampus.identity.dto.LoginRequest;
import com.smartcampus.identity.dto.LoginResponse;
import com.smartcampus.identity.dto.MfaChallenge;
import com.smartcampus.identity.dto.MfaVerifyRequest;
import com.smartcampus.identity.dto.RefreshRequest;
import com.smartcampus.identity.dto.RegisterRequest;
import com.smartcampus.identity.dto.UserDto;
import com.smartcampus.identity.service.RefreshTokenService;
import com.smartcampus.identity.service.UserService;
import com.smartcampus.identity.util.Totp;
import io.jsonwebtoken.Jwts;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.interfaces.RSAPrivateKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;
    private final RefreshTokenService refreshTokens;
    private final RSAPrivateKey privateKey;

    // pending TOTP challenges: challengeId -> userId
    private final Map<String, String> pendingMfa = new ConcurrentHashMap<>();

    public AuthController(UserService userService, RefreshTokenService refreshTokens, RSAPrivateKey privateKey) {
        this.userService = userService;
        this.refreshTokens = refreshTokens;
        this.privateKey = privateKey;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@RequestBody RegisterRequest req) {
        User u = userService.register(req.fullName(), req.email(), req.password());
        userService.record("REGISTER", u.getId(), null);
        return ResponseEntity.status(201).body(toDto(u));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        // Let ResponseStatusException propagate so the shared handler preserves
        // the real status (401 for bad credentials) instead of rewriting it to 500.
        User u = userService.authenticate(req.email(), req.password());
        if (u.isTotpEnabled()) {
            String challengeId = "chl_" + UUID.randomUUID();
            pendingMfa.put(challengeId, u.getId());
            userService.record("LOGIN_MFA_PENDING", u.getId(), null);
            return ResponseEntity.ok(new MfaChallenge(true, challengeId));
        }
        userService.record("LOGIN", u.getId(), null);
        return ResponseEntity.ok(issueTokens(u));
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<LoginResponse> verifyMfa(@RequestBody MfaVerifyRequest req) {
        String userId = pendingMfa.remove(req.challengeId());
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        User u = userService.findById(userId);
        if (!Totp.verify(u.getTotpSecret(), req.code(), u.getTotpLastUsed())) {
            return ResponseEntity.status(401).build();
        }
        // update replay guard
        userService.verifyTotp(userId, req.code());
        userService.record("LOGIN_MFA_SUCCESS", userId, null);
        return ResponseEntity.ok(issueTokens(u));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody RefreshRequest req) {
        var next = refreshTokens.rotate(req.refreshToken());
        User u = userService.findById(next.getUserId());
        return ResponseEntity.ok(new LoginResponse(
                issueAccessToken(u), next.getId(), 900, toDto(u)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshRequest req) {
        if (req != null && req.refreshToken() != null) {
            refreshTokens.revoke(req.refreshToken());
        }
        return ResponseEntity.noContent().build();
    }

    private LoginResponse issueTokens(User u) {
        String access = issueAccessToken(u);
        var refresh = refreshTokens.issue(u.getId());
        return new LoginResponse(access, refresh.getId(), 900, toDto(u));
    }

    private String issueAccessToken(User u) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(u.getId())
                .claim("role", u.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(15, ChronoUnit.MINUTES)))
                .signWith(privateKey)
                .compact();
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole().name(), u.isTotpEnabled());
    }
}
