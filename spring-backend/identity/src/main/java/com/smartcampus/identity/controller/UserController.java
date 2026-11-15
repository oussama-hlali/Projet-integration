package com.smartcampus.identity.controller;

import com.smartcampus.identity.dto.UserDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class UserController {

    @GetMapping("/users/me")
    public UserDto me() {
        // Stub: in production this reads the JWT subject and loads the user.
        return new UserDto("u1", "Ahmed Wardi", "ahmed.wardi@campus.tn", "STUDENT", false);
    }

    @GetMapping("/users")
    public List<UserDto> listUsers() {
        return List.of(
                new UserDto("u1", "Ahmed Wardi", "ahmed.wardi@campus.tn", "STUDENT", false),
                new UserDto("u3", "Sami Ben Ali", "sami.benali@campus.tn", "ADMINISTRATOR", false)
        );
    }

    @GetMapping("/auth/mfa/setup")
    public Map<String, String> mfaSetup() {
        String secret = "JBSWY3DPEHPK3PXP"; // demo secret, Base32
        String uri = "otpauth://totp/SmartCampus:ahmed.wardi@campus.tn"
                + "?secret=" + secret + "&issuer=SmartCampus&digits=6&period=30";
        return Map.of("secret", secret, "otpauthUri", uri);
    }
}
