package com.smartcampus.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Flattened KPI snapshot produced by the Angular admin dashboard. Every number
 * comes from a real per-service KPI endpoint; the optional collections let the
 * caller supply item/subject history when the source service exposes it.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record KpiSnapshot(
        Long usersTotal,
        Long studentsCount,
        Long staffCount,
        Long adminsCount,
        Long roomsTotal,
        Long roomsAvailable,
        Long roomsOccupied,
        Long roomsReserved,
        Long roomsMaintenance,
        Long reservationsTotal,
        Long reservationsPending,
        Long reservationsConfirmed,
        Long reservationsCancelled,
        Long reservationsCompleted,
        Long announcementsTotal,
        Long transportRoutes,
        Long eventsTotal,
        Long upcomingEvents,
        Long registrationsTotal,
        Long lostFoundTotal,
        Long lostFoundOpen,
        Long lostFoundClaimed,
        Long menusTotal,
        Long itemsTotal,
        Long ordersTotal,
        Long ordersCancelled,
        Long ordersActive,
        Long notificationsTotal,
        Long notificationsUnread,
        Long notificationsRead,
        List<StockSubject> stockSubjects,
        List<ChurnSubject> churnSubjects,
        List<MonthlyActual> monthlyActuals) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StockSubject(
            String id,
            String name,
            Double annualDemand,
            Double unitCost,
            Double leadTimeDays) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ChurnSubject(
            String id,
            String name,
            Double lastActiveDays,
            Double eventRegistrations,
            Double unreadNotifications,
            Double orders) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MonthlyActual(String month, Double value) {
    }

    public static long n(Long value) {
        return value == null ? 0L : value;
    }

    public static double d(Double value) {
        return value == null ? 0D : value;
    }
}
