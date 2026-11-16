package com.smartcampus.identity;

import com.smartcampus.identity.dto.RegisterRequest;
import com.smartcampus.identity.dto.UserDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
class IdentityIntegrationTest {

    @Autowired
    TestRestTemplate rest;

    @Test
    void registerForcesStudentRole() {
        RegisterRequest req = new RegisterRequest("Test User", "test1@campus.tn", "secret123");
        ResponseEntity<UserDto> res = rest.postForEntity("/api/v1/auth/register", req, UserDto.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().role()).isEqualTo("STUDENT");
    }

    @Test
    void duplicateEmailConflict() {
        RegisterRequest req = new RegisterRequest("Dup", "dup@campus.tn", "secret123");
        rest.postForEntity("/api/v1/auth/register", req, UserDto.class);
        ResponseEntity<String> res2 = rest.postForEntity("/api/v1/auth/register", req, String.class);
        assertThat(res2.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }
}
