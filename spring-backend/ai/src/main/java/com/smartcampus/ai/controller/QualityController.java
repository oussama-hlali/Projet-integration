package com.smartcampus.ai.controller;

import com.smartcampus.ai.service.QualityService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class QualityController {
    private final QualityService service;
    public QualityController(QualityService service) { this.service = service; }

    @GetMapping("/quality")
    public Map<String, Object> dashboard() { return service.dashboard(); }
}
