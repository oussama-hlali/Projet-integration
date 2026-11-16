package com.smartcampus.identity.service;

import com.smartcampus.identity.domain.AuditEvent;
import com.smartcampus.identity.domain.Role;
import com.smartcampus.identity.domain.User;
import com.smartcampus.identity.repository.AuditEventRepository;
import com.smartcampus.identity.repository.UserRepository;
import com.smartcampus.identity.util.Totp;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository users;
    private final AuditEventRepository audit;
    private final PasswordEncoder encoder;

    public UserService(UserRepository users, AuditEventRepository audit, PasswordEncoder encoder) {
        this.users = users;
        this.audit = audit;
        this.encoder = encoder;
    }

    public User register(String fullName, String email, String password) {
        if (users.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User u = new User();
        u.setId("u" + UUID.randomUUID().toString().substring(0, 8));
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(password));
        u.setRole(Role.STUDENT); // forced server-side, never from client
        u.setTheme("light");
        u.setLanguage("en");
        users.save(u);
        record("REGISTER", u.getId(), null);
        return u;
    }

    public User authenticate(String email, String password) {
        User u = users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!encoder.matches(password, u.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return u;
    }

    public User findById(String id) {
        return users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public User findByEmail(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public User updateProfile(String id, String fullName) {
        User u = findById(id);
        if (fullName != null && !fullName.isBlank()) u.setFullName(fullName);
        users.save(u);
        record("PROFILE_UPDATE", id, null);
        return u;
    }

    public User updatePreferences(String id, String theme, String language, Boolean notificationsEnabled) {
        User u = findById(id);
        if (theme != null) u.setTheme(theme);
        if (language != null) u.setLanguage(language);
        if (notificationsEnabled != null) u.setNotificationsEnabled(notificationsEnabled);
        users.save(u);
        record("PREFERENCES_UPDATE", id, null);
        return u;
    }

    public User updateRole(String id, Role role) {
        User u = findById(id);
        u.setRole(role);
        users.save(u);
        record("ROLE_CHANGE", id, null);
        return u;
    }

    public List<User> listAll() {
        return users.findAll();
    }

    public List<User> findByIds(List<String> ids) {
        return users.findAllByIdIn(ids);
    }

    public String startTotp(String userId) {
        User u = findById(userId);
        String secret = Totp.generateSecret();
        u.setTotpSecret(secret);
        // not enabled yet; enabled after first successful verify
        users.save(u);
        record("TOTP_SETUP", userId, null);
        return secret;
    }

    public boolean verifyTotp(String userId, String code) {
        User u = findById(userId);
        if (u.getTotpSecret() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TOTP not set up");
        }
        boolean ok = Totp.verify(u.getTotpSecret(), code, u.getTotpLastUsed());
        if (ok) {
            // replay guard: record the time step we just accepted
            long step = System.currentTimeMillis() / 1000 / 30;
            u.setTotpLastUsed(step);
            if (!u.isTotpEnabled()) u.setTotpEnabled(true);
            users.save(u);
            record("TOTP_VERIFY", userId, null);
        }
        return ok;
    }

    public void disableTotp(String userId) {
        User u = findById(userId);
        u.setTotpEnabled(false);
        u.setTotpSecret(null);
        u.setTotpLastUsed(null);
        users.save(u);
        record("TOTP_DISABLE", userId, null);
    }

    public void record(String action, String userId, String ip) {
        AuditEvent e = new AuditEvent();
        e.setUserId(userId);
        e.setAction(action);
        e.setIp(ip);
        audit.save(e);
    }
}
