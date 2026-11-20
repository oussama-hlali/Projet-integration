package com.smartcampus.identity.service;

import com.smartcampus.identity.domain.Role;
import com.smartcampus.identity.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class IdentityKpiService {
    private final UserRepository users;

    public IdentityKpiService(UserRepository users) { this.users = users; }

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
