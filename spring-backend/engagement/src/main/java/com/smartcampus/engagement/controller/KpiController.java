package com.smartcampus.engagement.controller;

import com.smartcampus.engagement.repository.EventRegistrationRepository;
import com.smartcampus.engagement.repository.EventRepository;
import com.smartcampus.engagement.repository.LostFoundRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class KpiController {
    private final EventRepository events;
    private final EventRegistrationRepository registrations;
    private final LostFoundRepository lostFound;

    public KpiController(EventRepository events, EventRegistrationRepository registrations,
                         LostFoundRepository lostFound) {
        this.events = events; this.registrations = registrations; this.lostFound = lostFound;
    }

    @GetMapping("/engagement/kpi")
    public Map<String, Object> kpi() {
        return Map.of(
                "eventsTotal", events.count(),
                "registrationsTotal", registrations.count(),
                "lostFoundTotal", lostFound.count(),
                "lostFoundOpen", lostFound.findAll().stream().filter(l -> !"CLAIMED".equals(l.getStatus())).count(),
                "lostFoundClaimed", lostFound.findAll().stream().filter(l -> "CLAIMED".equals(l.getStatus())).count()
        );
    }
}
