package com.smartcampus.identity.controller;

import com.smartcampus.identity.domain.User;
import com.smartcampus.identity.dto.LoginRequest;
import com.smartcampus.identity.dto.MfaChallenge;
import com.smartcampus.identity.dto.MfaVerifyRequest;
import com.smartcampus.identity.dto.RegisterRequest;
import com.smartcampus.identity.dto.SessionResponse;
import com.smartcampus.identity.dto.UserDto;
import com.smartcampus.identity.service.RefreshTokenService;
import com.smartcampus.identity.service.UserService;
import com.smartcampus.identity.util.Totp;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.interfaces.RSAPrivateKey;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String CSRF_HEADER = "X-CSRF-Protected";

    private final UserService userService;
    private final RefreshTokenService refreshTokens;
    private final RSAPrivateKey privateKey;

    @Value("${auth.refresh-cookie.name:sc_refresh}")
    private String cookieName;
    @Value("${auth.refresh-cookie.same-site:None}")
    private String cookieSameSite;
    @Value("${auth.refresh-cookie.secure:true}")
    private boolean cookieSecure;
    @Value("${auth.refresh-cookie.max-age-seconds:2592000}")
    private long cookieMaxAgeSeconds;

    // pending TOTP challenges: challengeId -> userId / generated enrolment secret
    private final Map<String, String> pendingMfa = new ConcurrentHashMap<>();
    private final Map<String, String> pendingMfaSecrets = new ConcurrentHashMap<>();

    public AuthController(UserService userService, RefreshTokenService refreshTokens, RSAPrivateKey privateKey) {
        this.userService = userService;
        this.refreshTokens = refreshTokens;
        this.privateKey = privateKey;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@RequestBody RegisterRequest req) {
        User u = userService.register(req.fullName(), req.email(), req.password());
        return ResponseEntity.status(201).body(toDto(u));
    }

    /**
     * Password verification never issues a session by itself: every login must
     * finish TOTP. Accounts without a secret are routed through enrolment first.
     */
    @PostMapping("/login")
    public ResponseEntity<MfaChallenge> login(@RequestBody LoginRequest req) {
        User u = userService.authenticate(req.email(), req.password());
        String challengeId = "chl_" + UUID.randomUUID();
        pendingMfa.put(challengeId, u.getId());
        userService.record("LOGIN_MFA_PENDING", u.getId(), null);
        return ResponseEntity.ok(new MfaChallenge(
                true,
                !u.isTotpEnabled(),
                challengeId,
                u.getId()));
    }

    /** Generate the enrolment secret for a pending login challenge. */
    @PostMapping("/mfa/setup")
    public ResponseEntity<Map<String, String>> mfaSetup(@RequestBody Map<String, String> body) {
        String userId = pendingMfa.get(body.get("challengeId"));
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        User u = userService.findById(userId);
        // Re-reading the setup page must not invalidate the QR code the student
        // already scanned, so the secret is generated once per challenge.
        String secret = pendingMfaSecrets.computeIfAbsent(
                body.get("challengeId"), ignored -> userService.startTotp(userId));
        return ResponseEntity.ok(Map.of(
                "secret", secret,
                "otpauthUri", Totp.otpauthUri(secret, u.getEmail())));
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<SessionResponse> verifyMfa(@RequestBody MfaVerifyRequest req,
                                                     HttpServletResponse response) {
        String userId = pendingMfa.get(req.challengeId());
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        // Verifies the code, persists the replay guard and enables 2FA on first
        // enrolment. A bad code leaves the challenge usable for a retry.
        boolean ok;
        try {
            ok = userService.verifyTotp(userId, req.code());
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).build();
        }
        if (!ok) {
            return ResponseEntity.status(401).build();
        }
        pendingMfa.remove(req.challengeId());
        pendingMfaSecrets.remove(req.challengeId());
        User u = userService.findById(userId);
        userService.record("LOGIN_MFA_SUCCESS", userId, null);
        return ResponseEntity.ok(issueTokens(u, response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<SessionResponse> refresh(
            @CookieValue(name = "${auth.refresh-cookie.name:sc_refresh}", required = false) String tokenId,
            @RequestHeader(name = CSRF_HEADER, required = false) String csrf,
            HttpServletResponse response) {
        requireCsrf(csrf);
        if (tokenId == null || tokenId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing refresh cookie");
        }

        var next = refreshTokens.rotate(tokenId);
        writeCookie(response, next.getId(), cookieMaxAgeSeconds);
        User u = userService.findById(next.getUserId());
        return ResponseEntity.ok(new SessionResponse(
                issueAccessToken(u), 900, toDto(u)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "${auth.refresh-cookie.name:sc_refresh}", required = false) String tokenId,
            @RequestHeader(name = CSRF_HEADER, required = false) String csrf,
            HttpServletResponse response) {
        requireCsrf(csrf);
        if (tokenId != null && !tokenId.isBlank()) {
            refreshTokens.revoke(tokenId);
        }
        writeCookie(response, "", 0);
        return ResponseEntity.noContent().build();
    }

    private SessionResponse issueTokens(User u, HttpServletResponse response) {
        String access = issueAccessToken(u);
        var refresh = refreshTokens.issue(u.getId());
        writeCookie(response, refresh.getId(), cookieMaxAgeSeconds);
        return new SessionResponse(access, 900, toDto(u));
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

    private void requireCsrf(String header) {
        if (!"1".equals(header)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "CSRF header required");
        }
    }

    private void writeCookie(HttpServletResponse response, String value, long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/api/v1/auth")
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private UserDto toDto(User u) {
        return new UserDto(
                u.getId(),
                u.getFullName(),
                u.getEmail(),
                u.getRole().name(),
                u.isTotpEnabled(),
                u.getTheme(),
                u.getLanguage(),
                u.isNotificationsEnabled());
    }
}
