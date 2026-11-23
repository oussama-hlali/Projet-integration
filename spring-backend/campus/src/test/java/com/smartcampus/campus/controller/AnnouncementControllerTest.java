package com.smartcampus.campus.controller;

import com.smartcampus.campus.domain.Announcement;
import com.smartcampus.campus.service.AnnouncementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AnnouncementControllerTest {

    private AnnouncementService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(AnnouncementService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new AnnouncementController(service)).build();
    }

    @Test
    void createReadsContentFromBodyField() throws Exception {
        Announcement created = announcement();
        when(service.create("Notice", "Details", "GENERAL", true, "admin-1")).thenReturn(created);

        mockMvc.perform(post("/api/v1/announcements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Notice","body":"Details","category":"GENERAL",
                                 "pinned":true,"authorId":"admin-1"}
                                """))
                .andExpect(status().isOk());

        verify(service).create("Notice", "Details", "GENERAL", true, "admin-1");
    }

    @Test
    void updateReadsContentFromBodyField() throws Exception {
        Announcement updated = announcement();
        when(service.update("a1", null, "New details", null, true)).thenReturn(updated);

        mockMvc.perform(put("/api/v1/announcements/a1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"body":"New details","pinned":true}
                                """))
                .andExpect(status().isOk());

        verify(service).update("a1", null, "New details", null, true);
    }

    private Announcement announcement() {
        Announcement announcement = new Announcement();
        announcement.setId("a1");
        announcement.setTitle("Notice");
        announcement.setBody("Details");
        announcement.setCategory("GENERAL");
        return announcement;
    }
}
