package com.smartcampus.identity.controller;

import com.smartcampus.identity.dto.LoginRequest;
import com.smartcampus.identity.dto.LoginResponse;
import com.smartcampus.identity.dto.MfaChallenge;
import com.smartcampus.identity.dto.MfaVerifyRequest;
import com.smartcampus.identity.dto.RefreshRequest;
import com.smartcampus.identity.dto.UserDto;
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

/**
 * Stub authentication. Demo users are hard-coded; replace with a real
 * user store + password hashing in the next sprint.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private record DemoUser(String id, String fullName, String email, String role, String password, boolean totpEnabled) {}

    private static final Map<String, DemoUser> USERS = Map.of(
            "ahmed.wardi@campus.tn", new DemoUser("u1", "Ahmed Wardi", "ahmed.wardi@campus.tn", "STUDENT", "student123", false),
            "sami.benali@campus.tn", new DemoUser("u3", "Sami Ben Ali", "sami.benali@campus.tn", "ADMINISTRATOR", "admin123", false)
    );

    private final RSAPrivateKey privateKey;

    public AuthController(RSAPrivateKey privateKey) {
        this.privateKey = privateKey;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        DemoUser user = USERS.get(request.email());
        if (user == null || !user.password().equals(request.password())) {
            return ResponseEntity.status(401).body(
                    com.smartcampus.common.ProblemDetails.of(401, "Invalid credentials",
                            "Email or password is wrong.", "INVALID_CREDENTIALS"));
        }

        if (user.email().contains("totp")) {
            return ResponseEntity.ok(new MfaChallenge(true, "chl_" + UUID.randomUUID()));
        }

        return ResponseEntity.ok(issueTokens(user));
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<LoginResponse> verifyMfa(@RequestBody MfaVerifyRequest request) {
        if (request.code() == null || request.code().length() != 6) {
            return ResponseEntity.status(401).build();
        }
        DemoUser user = USERS.get("ahmed.wardi@campus.tn");
        return ResponseEntity.ok(issueTokens(user));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody RefreshRequest request) {
        if (request.refreshToken() == null || request.refreshToken().isBlank()) {
            return ResponseEntity.status(401).build();
        }
        DemoUser user = USERS.values().iterator().next();
        return ResponseEntity.ok(issueTokens(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    private LoginResponse issueTokens(DemoUser user) {
        Instant now = Instant.now();
        String accessToken = Jwts.builder()
                .subject(user.id())
                .claim("role", user.role())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(15, ChronoUnit.MINUTES)))
                .signWith(privateKey)
                .compact();
        UserDto dto = new UserDto(user.id(), user.fullName(), user.email(), user.role(), user.totpEnabled());
        return new LoginResponse(accessToken, UUID.randomUUID().toString(), 900, dto);
    }
}
