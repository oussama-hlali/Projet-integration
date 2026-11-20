package com.smartcampus.identity.controller;

import com.smartcampus.identity.service.IdentityKpiService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class KpiController {
    private final IdentityKpiService kpis;

    public KpiController(IdentityKpiService kpis) { this.kpis = kpis; }

    @GetMapping("/identity/kpi")
    public Map<String, Object> kpi() { return kpis.kpi(); }
}
