package com.smartcampus.identity.controller;

import com.smartcampus.identity.domain.Role;
import com.smartcampus.identity.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class KpiController {
    private final UserRepository users;

    public KpiController(UserRepository users) { this.users = users; }

    @GetMapping("/identity/kpi")
    public Map<String, Object> kpi() {
        var all = users.findAll();
        return Map.of(
                "usersTotal", users.count(),
                "studentsCount", all.stream().filter(u -> u.getRole() == Role.STUDENT).count(),
                "staffCount", all.stream().filter(u -> u.getRole() == Role.STAFF).count(),
                "adminsCount", all.stream().filter(u -> u.getRole() == Role.ADMINISTRATOR).count()
        );
    }
}
