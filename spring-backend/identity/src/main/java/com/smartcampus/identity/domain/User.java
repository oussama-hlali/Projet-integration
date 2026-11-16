package com.smartcampus.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "users", schema = "identity")
public class User {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "full_name", length = 120, nullable = false)
    private String fullName;

    @Column(length = 160, nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    private Role role;

    @Column(name = "totp_enabled", nullable = false)
    private boolean totpEnabled;

    @Column(name = "totp_secret", length = 64)
    private String totpSecret;

    @Column(name = "totp_last_used")
    private Long totpLastUsed;

    @Column(length = 16)
    private String theme;

    @Column(length = 8)
    private String language;

    @Column(name = "notifications_enabled", nullable = false)
    private boolean notificationsEnabled = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public boolean isTotpEnabled() { return totpEnabled; }
    public void setTotpEnabled(boolean totpEnabled) { this.totpEnabled = totpEnabled; }
    public String getTotpSecret() { return totpSecret; }
    public void setTotpSecret(String totpSecret) { this.totpSecret = totpSecret; }
    public Long getTotpLastUsed() { return totpLastUsed; }
    public void setTotpLastUsed(Long totpLastUsed) { this.totpLastUsed = totpLastUsed; }
    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public boolean isNotificationsEnabled() { return notificationsEnabled; }
    public void setNotificationsEnabled(boolean notificationsEnabled) { this.notificationsEnabled = notificationsEnabled; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
