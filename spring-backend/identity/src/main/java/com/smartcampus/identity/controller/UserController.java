package com.smartcampus.identity.controller;

import com.smartcampus.identity.domain.Role;
import com.smartcampus.identity.domain.User;
import com.smartcampus.identity.dto.UpdatePreferencesRequest;
import com.smartcampus.identity.dto.UpdateProfileRequest;
import com.smartcampus.identity.dto.UserDto;
import com.smartcampus.identity.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users/me")
    public UserDto me(@AuthenticationPrincipal Jwt jwt) {
        return toDto(userService.findById(subject(jwt)));
    }

    @PatchMapping("/users/me")
    public UserDto updateProfile(@AuthenticationPrincipal Jwt jwt,
                                 @RequestBody UpdateProfileRequest req) {
        return toDto(userService.updateProfile(subject(jwt), req.fullName()));
    }

    @PatchMapping("/users/me/preferences")
    public UserDto updatePreferences(@AuthenticationPrincipal Jwt jwt,
                                     @RequestBody UpdatePreferencesRequest req) {
        return toDto(userService.updatePreferences(
                subject(jwt), req.theme(), req.language(), req.notificationsEnabled()));
    }

    @GetMapping("/users")
    public List<UserDto> listUsers() {
        return userService.listAll().stream().map(this::toDto).toList();
    }

    @GetMapping("/users/batch")
    public List<UserDto> batch(@RequestParam List<String> ids) {
        return userService.findByIds(ids).stream().map(this::toDto).toList();
    }

    @PostMapping("/users")
    public UserDto createUser(@RequestBody Map<String, Object> body) {
        return toDto(userService.createManaged(
                text(body.get("fullName")),
                text(body.get("email")),
                text(body.get("password")),
                parseRole(body.get("role"))));
    }

    @PatchMapping("/users/{id}")
    public UserDto updateUser(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return toDto(userService.updateAccount(
                id,
                body.get("fullName") == null ? null : text(body.get("fullName")),
                body.get("email") == null ? null : text(body.get("email")),
                body.get("role") == null ? null : parseRole(body.get("role"))));
    }

    @PostMapping("/users/{id}/password-reset")
    public Map<String, Object> resetPassword(@PathVariable String id,
                                             @RequestBody Map<String, String> body) {
        userService.resetPassword(id, body.get("password"));
        return Map.of("reset", true);
    }

    @DeleteMapping("/users/{id}")
    public Map<String, Object> deleteUser(@PathVariable String id,
                                          @AuthenticationPrincipal Jwt jwt) {
        userService.deleteUser(id, subject(jwt));
        return Map.of("deleted", true);
    }

    @PatchMapping("/users/{id}/role")
    public UserDto changeRole(@PathVariable String id, @RequestBody Map<String, String> body) {
        return toDto(userService.updateRole(id, Role.valueOf(body.get("role"))));
    }

    private String subject(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing access token");
        }
        return jwt.getSubject();
    }

    private String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Role parseRole(Object value) {
        if (value == null) return null;
        try {
            return Role.valueOf(String.valueOf(value).toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown role");
        }
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
