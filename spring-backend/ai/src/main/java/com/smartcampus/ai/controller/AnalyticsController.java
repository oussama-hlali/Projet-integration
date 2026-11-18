package com.smartcampus.ai.controller;

import com.smartcampus.ai.service.AnalyticsService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AnalyticsController {
    private final AnalyticsService service;
    public AnalyticsController(AnalyticsService service) { this.service = service; }

    @PostMapping("/analytics")
    public Map<String, Object> ask(@RequestBody Map<String, String> body) {
        return Map.of("answer", service.answer(body.get("question")));
    }
}
