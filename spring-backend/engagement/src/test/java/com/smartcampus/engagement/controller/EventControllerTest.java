package com.smartcampus.engagement.controller;

import com.smartcampus.engagement.domain.Event;
import com.smartcampus.engagement.domain.EventRegistration;
import com.smartcampus.engagement.service.EventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class EventControllerTest {

    private EventService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(EventService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new EventController(service)).build();
    }

    @Test
    void createPersistsEndDateAndRoomId() throws Exception {
        Instant start = Instant.parse("2026-11-25T10:00:00Z");
        Instant end = Instant.parse("2026-11-25T12:00:00Z");
        when(service.create("Forum", "Details", "CAREER", start, end, "Hall", 80, "u1", "room-1"))
                .thenReturn(event());

        mockMvc.perform(post("/api/v1/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Forum","description":"Details","category":"CAREER",
                                 "date":"2026-11-25T10:00:00Z","endDate":"2026-11-25T12:00:00Z",
                                 "location":"Hall","capacity":80,"organizerId":"u1","roomId":"room-1"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("e1"));

        verify(service).create("Forum", "Details", "CAREER", start, end, "Hall", 80, "u1", "room-1");
    }

    @Test
    void removeInterestCallsTheBackendDelete() throws Exception {
        when(service.removeInterest("e1", "u1")).thenReturn(true);

        mockMvc.perform(delete("/api/v1/events/e1/interest").param("userId", "u1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.interested").value(false));

        verify(service).removeInterest("e1", "u1");
    }

    @Test
    void registrationReturnsTheQrCode() throws Exception {
        EventRegistration registration = new EventRegistration();
        registration.setId("reg1");
        registration.setQrCode("QR-1");
        when(service.register("e1", "u1")).thenReturn(registration);

        mockMvc.perform(post("/api/v1/events/e1/registrations").param("userId", "u1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrCode").value("QR-1"));

        verify(service).register("e1", "u1");
    }

    private Event event() {
        Event event = new Event();
        event.setId("e1");
        event.setTitle("Forum");
        event.setCategory("CAREER");
        return event;
    }
}
