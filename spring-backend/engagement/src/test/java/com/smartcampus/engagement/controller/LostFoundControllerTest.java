package com.smartcampus.engagement.controller;

import com.smartcampus.engagement.domain.LostFoundComment;
import com.smartcampus.engagement.domain.LostFoundItem;
import com.smartcampus.engagement.service.LostFoundService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LostFoundControllerTest {

    private LostFoundService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(LostFoundService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LostFoundController(service)).build();
    }

    @Test
    void createPersistsTheFrontendReportFields() throws Exception {
        when(service.create("Keys", "Found near the library", "FOUND", "u1", "Library",
                "Electronics", "+21612345678", List.of("u2"), null)).thenReturn(item());

        mockMvc.perform(post("/api/v1/lost-found")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Keys","description":"Found near the library",
                                 "status":"FOUND","reporterId":"u1","location":"Library",
                                 "category":"Electronics","contactPhone":"+21612345678",
                                 "taggedUserIds":["u2"]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("lf1"));

        verify(service).create("Keys", "Found near the library", "FOUND", "u1", "Library",
                "Electronics", "+21612345678", List.of("u2"), null);
    }

    @Test
    void createPersistsThePublishedPhoto() throws Exception {
        when(service.create("Wallet", "Blue wallet", "LOST", "u1", "Library",
                null, null, null, "YWJj")).thenReturn(item());

        mockMvc.perform(post("/api/v1/lost-found")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Wallet","description":"Blue wallet","status":"LOST",
                                 "reporterId":"u1","location":"Library","photoData":"YWJj"}
                                """))
                .andExpect(status().isOk());

        verify(service).create("Wallet", "Blue wallet", "LOST", "u1", "Library",
                null, null, null, "YWJj");
    }

    @Test
    void oversizedPhotoIsRejectedBeforeReachingTheService() throws Exception {
        String tooLarge = "A".repeat(2_000_001);

        mockMvc.perform(post("/api/v1/lost-found")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Keys\",\"reporterId\":\"u1\",\"photoData\":\"" + tooLarge + "\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }

    @Test
    void invalidStatusIsRejectedBeforeReachingTheService() throws Exception {
        mockMvc.perform(patch("/api/v1/lost-found/lf1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ARCHIVED\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }

    @Test
    void claimUsesTheDedicatedEndpoint() throws Exception {
        LostFoundItem claimed = item();
        claimed.setStatus("CLAIMED");
        when(service.claim("lf1")).thenReturn(claimed);

        mockMvc.perform(post("/api/v1/lost-found/lf1/claim"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLAIMED"));

        verify(service).claim("lf1");
    }

    @Test
    void commentKeepsMentionedUsers() throws Exception {
        LostFoundComment comment = new LostFoundComment();
        comment.setId("c1");
        comment.setMessage("I know the owner");
        when(service.addComment("lf1", "u2", "I know the owner", List.of("u1")))
                .thenReturn(comment);

        mockMvc.perform(post("/api/v1/lost-found/lf1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"authorId":"u2","message":"I know the owner","taggedUserIds":["u1"]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("c1"));

        verify(service).addComment("lf1", "u2", "I know the owner", List.of("u1"));
    }

    private LostFoundItem item() {
        LostFoundItem item = new LostFoundItem();
        item.setId("lf1");
        item.setTitle("Keys");
        item.setStatus("FOUND");
        return item;
    }
}
