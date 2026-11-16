package com.smartcampus.identity.config;

import com.smartcampus.identity.domain.Role;
import com.smartcampus.identity.domain.User;
import com.smartcampus.identity.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seeds the demo accounts used by the frontend and the smoke tests.
 * Only active in the "dev" profile so production stays clean.
 */
@Configuration
@Profile("dev")
public class DevDataSeeder {

    @Bean
    CommandLineRunner seedDemoUsers(UserRepository users, PasswordEncoder encoder) {
        return args -> {
            if (users.findByEmail("ahmed.wardi@campus.tn").isEmpty()) {
                User u = new User();
                u.setId("u1");
                u.setFullName("Ahmed Wardi");
                u.setEmail("ahmed.wardi@campus.tn");
                u.setPasswordHash(encoder.encode("student123"));
                u.setRole(Role.STUDENT);
                u.setTheme("light");
                u.setLanguage("en");
                users.save(u);
            }
            if (users.findByEmail("sami.benali@campus.tn").isEmpty()) {
                User u = new User();
                u.setId("u3");
                u.setFullName("Sami Ben Ali");
                u.setEmail("sami.benali@campus.tn");
                u.setPasswordHash(encoder.encode("admin123"));
                u.setRole(Role.ADMINISTRATOR);
                u.setTheme("light");
                u.setLanguage("en");
                users.save(u);
            }
        };
    }
}
