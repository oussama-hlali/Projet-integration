package com.smartcampus.campus.service;

import com.smartcampus.campus.domain.TransportDeparture;
import com.smartcampus.campus.domain.TransportRoute;
import com.smartcampus.campus.domain.TransportStop;
import com.smartcampus.campus.repository.TransportDepartureRepository;
import com.smartcampus.campus.repository.TransportRouteRepository;
import com.smartcampus.campus.repository.TransportStopRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransportService {
    private final TransportRouteRepository routes;
    private final TransportStopRepository stops;
    private final TransportDepartureRepository departures;

    public TransportService(TransportRouteRepository routes, TransportStopRepository stops, TransportDepartureRepository departures) {
        this.routes = routes; this.stops = stops; this.departures = departures;
    }

    public List<TransportRoute> routes() { return routes.findAll(); }
    public List<TransportStop> stopsFor(String routeId) { return stops.findByRouteIdOrderBySequenceAsc(routeId); }
    public List<TransportDeparture> departuresFor(String stopId) { return departures.findByStopIdOrderByDepartureTimeAsc(stopId); }
}
