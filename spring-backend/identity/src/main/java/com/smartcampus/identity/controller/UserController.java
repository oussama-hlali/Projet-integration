package com.smartcampus.identity.controller;

import com.smartcampus.identity.domain.Role;
import com.smartcampus.identity.domain.User;
import com.smartcampus.identity.dto.UpdatePreferencesRequest;
import com.smartcampus.identity.dto.UpdateProfileRequest;
import com.smartcampus.identity.dto.UserDto;
import com.smartcampus.identity.service.UserService;
import com.smartcampus.identity.util.Totp;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users/me")
    public UserDto me() {
        // In production this reads the JWT subject; stub returns the demo student.
        User u = userService.findById("u1");
        return toDto(u);
    }

    @PatchMapping("/users/me")
    public UserDto updateProfile(@RequestBody UpdateProfileRequest req) {
        User u = userService.updateProfile("u1", req.fullName());
        return toDto(u);
    }

    @PatchMapping("/users/me/preferences")
    public UserDto updatePreferences(@RequestBody UpdatePreferencesRequest req) {
        User u = userService.updatePreferences("u1", req.theme(), req.language(), req.notificationsEnabled());
        return toDto(u);
    }

    @GetMapping("/users")
    public List<UserDto> listUsers() {
        return userService.listAll().stream().map(this::toDto).toList();
    }

    @GetMapping("/users/batch")
    public List<UserDto> batch(@RequestParam List<String> ids) {
        return userService.findByIds(ids).stream().map(this::toDto).toList();
    }

    @PatchMapping("/users/{id}/role")
    public UserDto changeRole(@PathVariable String id, @RequestBody Map<String, String> body) {
        Role role = Role.valueOf(body.get("role"));
        User u = userService.updateRole(id, role);
        return toDto(u);
    }

    @PostMapping("/auth/mfa/setup")
    public Map<String, String> mfaSetup() {
        String userId = "u1";
        String secret = userService.startTotp(userId);
        User u = userService.findById(userId);
        return Map.of("secret", secret, "otpauthUri", Totp.otpauthUri(secret, u.getEmail()));
    }

    @PostMapping("/auth/mfa/disable")
    public Map<String, Object> mfaDisable() {
        userService.disableTotp("u1");
        return Map.of("disabled", true);
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole().name(), u.isTotpEnabled());
    }
}
