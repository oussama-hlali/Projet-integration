package com.smartcampus.campus.controller;

import com.smartcampus.campus.domain.TransportDeparture;
import com.smartcampus.campus.domain.TransportRoute;
import com.smartcampus.campus.domain.TransportStop;
import com.smartcampus.campus.service.TransportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/transport")
public class TransportController {
    private final TransportService service;
    public TransportController(TransportService service) { this.service = service; }

    @GetMapping("/routes")
    public List<TransportRoute> routes() { return service.routes(); }

    @GetMapping("/routes/{routeId}/stops")
    public List<TransportStop> stops(@PathVariable String routeId) { return service.stopsFor(routeId); }

    @GetMapping("/stops/{stopId}/departures")
    public List<TransportDeparture> departures(@PathVariable String stopId) { return service.departuresFor(stopId); }
}
