package com.smartcampus.campus.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(c -> c.disable())
            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers(HttpMethod.GET,
                        "/api/v1/announcements", "/api/v1/announcements/**").authenticated()
                .requestMatchers(HttpMethod.POST,
                        "/api/v1/announcements", "/api/v1/announcements/**").hasRole("ADMINISTRATOR")
                .requestMatchers(HttpMethod.PUT,
                        "/api/v1/announcements", "/api/v1/announcements/**").hasRole("ADMINISTRATOR")
                .requestMatchers(HttpMethod.DELETE,
                        "/api/v1/announcements", "/api/v1/announcements/**").hasRole("ADMINISTRATOR")
                .anyRequest().authenticated())
            .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(new JwtRoleConverter())));
        return http.build();
    }
}
