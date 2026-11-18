package com.smartcampus.ai.service;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AnalyticsService {
    public String answer(String question) {
        if (question == null) return "Please ask a question.";
        String q = question.toLowerCase();
        if (q.contains("reservation")) return "Reservations: see /api/v1/campus/kpi for counts.";
        if (q.contains("event")) return "Events: see /api/v1/engagement/kpi for counts.";
        if (q.contains("order") || q.contains("cafeteria")) return "Cafeteria: see /api/v1/cafeteria/kpi.";
        if (q.contains("notification")) return "Notifications: see /api/v1/notifications/kpi.";
        return "I can answer questions about reservations, events, cafeteria and notifications. Try asking about one of those.";
    }
}
