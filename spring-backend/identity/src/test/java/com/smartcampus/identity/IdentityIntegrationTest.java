package com.smartcampus.identity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.identity.dto.RegisterRequest;
import com.smartcampus.identity.dto.UserDto;
import com.smartcampus.identity.util.Totp;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("dev")
class IdentityIntegrationTest {

    @Autowired
    TestRestTemplate rest;

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper mapper;

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

    @Test
    void loginRequiresTotpBeforeIssuingCookieSession() throws Exception {
        JsonNode challenge = mapper.readTree(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"sami.benali@campus.tn\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaRequired").value(true))
                .andExpect(jsonPath("$.challengeId").exists())
                .andExpect(jsonPath("$.accessToken").doesNotExist())
                .andReturn().getResponse().getContentAsString());

        String challengeId = challenge.get("challengeId").asText();
        JsonNode setup = mapper.readTree(mockMvc.perform(post("/api/v1/auth/mfa/setup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"challengeId\":\"" + challengeId + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        String secret = setup.get("secret").asText();
        String code = Totp.code(secret, System.currentTimeMillis() / 1000 / 30);

        mockMvc.perform(post("/api/v1/auth/mfa/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"challengeId\":\"" + challengeId + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", allOf(
                        containsString("sc_refresh="),
                        containsString("HttpOnly"),
                        containsString("SameSite=Lax"),
                        containsString("Path=/api/v1/auth"))))
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }

    @Test
    void refreshRequiresCookieAndCsrfHeader() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void invalidCredentialsReturnUnauthorizedNotInternalError() throws Exception {
        // MockMvc avoids the TestRestTemplate streaming-mode retry issue on 401
        // while exercising the same controller and global exception handler.
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@campus.tn\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}
