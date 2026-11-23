package com.smartcampus.campus.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import static org.assertj.core.api.Assertions.assertThat;

class JwtRoleConverterTest {

    private final JwtRoleConverter converter = new JwtRoleConverter();

    @Test
    void mapsRoleClaimToSpringAuthority() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .subject("admin-1")
                .claim("role", "ADMINISTRATOR")
                .build();

        assertThat(converter.convert(jwt).getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_ADMINISTRATOR");
    }

    @Test
    void noRoleClaimProducesNoAuthorities() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .subject("student-1")
                .build();

        assertThat(converter.convert(jwt).getAuthorities()).isEmpty();
    }
}
