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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository users;
    private final AuditEventRepository audit;
    private final PasswordEncoder encoder;
    private final com.smartcampus.identity.config.NotificationClient notifications;

    public UserService(UserRepository users, AuditEventRepository audit, PasswordEncoder encoder,
                       com.smartcampus.identity.config.NotificationClient notifications) {
        this.users = users;
        this.audit = audit;
        this.encoder = encoder;
        this.notifications = notifications;
    }

    public User register(String fullName, String email, String password) {
        requireEmail(email);
        requirePassword(password);
        if (users.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User u = new User();
        u.setId("u" + UUID.randomUUID().toString().substring(0, 8));
        u.setFullName(requireName(fullName));
        u.setEmail(email.trim().toLowerCase(Locale.ROOT));
        u.setPasswordHash(encoder.encode(password));
        u.setRole(Role.STUDENT); // forced server-side, never from client
        u.setTheme("light");
        u.setLanguage("en");
        u.setNotificationsEnabled(true);
        users.save(u);
        record("REGISTER", u.getId(), null);
        notifications.notify(u.getId(), "SYSTEM", "Welcome to Smart Campus", u.getId());
        return u;
    }

    /** Administrator-created account: role is explicit and 2FA is enrolled on first login. */
    public User createManaged(String fullName, String email, String password, Role role) {
        requireEmail(email);
        requirePassword(password);
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role is required");
        }
        if (users.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User u = new User();
        u.setId("u" + UUID.randomUUID().toString().substring(0, 8));
        u.setFullName(requireName(fullName));
        u.setEmail(email.trim().toLowerCase(Locale.ROOT));
        u.setPasswordHash(encoder.encode(password));
        u.setRole(role);
        u.setTheme("light");
        u.setLanguage("en");
        u.setNotificationsEnabled(true);
        users.save(u);
        record("USER_CREATED", u.getId(), null);
        return u;
    }

    public User authenticate(String email, String password) {
        User u = users.findByEmail(email == null ? "" : email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!encoder.matches(password == null ? "" : password, u.getPasswordHash())) {
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
        if (fullName != null && !fullName.isBlank()) u.setFullName(fullName.trim());
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

    @Transactional
    public User updateAccount(String id, String fullName, String email, Role role) {
        User u = findById(id);
        String normalizedEmail = email == null ? u.getEmail() : email.trim().toLowerCase(Locale.ROOT);
        if (!normalizedEmail.equals(u.getEmail())) {
            requireEmail(normalizedEmail);
            if (users.findByEmail(normalizedEmail).isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
            }
            u.setEmail(normalizedEmail);
        }
        if (fullName != null) u.setFullName(requireName(fullName));
        if (role != null) {
            if (u.getRole() == Role.ADMINISTRATOR && role != Role.ADMINISTRATOR && adminCount() <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot demote the last administrator");
            }
            u.setRole(role);
        }
        users.save(u);
        record("USER_UPDATED", id, null);
        return u;
    }

    public User updateRole(String id, Role role) {
        User u = findById(id);
        if (u.getRole() == Role.ADMINISTRATOR && role != Role.ADMINISTRATOR && adminCount() <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot demote the last administrator");
        }
        u.setRole(role);
        users.save(u);
        record("ROLE_CHANGE", id, null);
        return u;
    }

    @Transactional
    public void deleteUser(String id, String requesterId) {
        User u = findById(id);
        if (id.equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete your own account");
        }
        if (u.getRole() == Role.ADMINISTRATOR && adminCount() <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete the last administrator");
        }
        users.delete(u);
        record("USER_DELETED", id, null);
    }

    public void resetPassword(String id, String password) {
        requirePassword(password);
        User u = findById(id);
        u.setPasswordHash(encoder.encode(password));
        users.save(u);
        record("PASSWORD_RESET", id, null);
    }

    private long adminCount() {
        return users.findAll().stream().filter(u -> u.getRole() == Role.ADMINISTRATOR).count();
    }

    private String requireName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fullName is required");
        }
        return fullName.trim();
    }

    private void requireEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid email is required");
        }
    }

    private void requirePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        }
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
