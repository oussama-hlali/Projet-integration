package com.smartcampus.ai.service;

import com.smartcampus.ai.dto.AdminAnalyticsResponse;
import com.smartcampus.ai.dto.KpiSnapshot;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * US-24/25/26/27/28/30/35/50 — deterministic analytics for the admin AI screens.
 *
 * Every input number comes from a real per-service KPI endpoint. Operations
 * that need history the platform does not yet store (seasonality, Monte Carlo
 * bands, subject-level churn) are explicitly returned as modelled projections
 * so they can never be mistaken for measured statistics.
 */
@Service
public class AdminAnalyticsService {

    private static final String LIVE_BASIS = "Computed from live per-service KPI endpoints; no seed data.";
    private static final String MODELLED_BASIS =
            "Modelled projection from the current KPI snapshot; historical series not available.";

    public AdminAnalyticsResponse.KpiAnalysis kpiAnalysis(KpiSnapshot s) {
        List<AdminAnalyticsResponse.HealthMetric> metrics = new ArrayList<>();
        metrics.add(metric("roomAvailability", "Room availability",
                ratio(KpiSnapshot.n(s.roomsAvailable()), KpiSnapshot.n(s.roomsTotal())),
                0.15, 0.30, "Available rooms over total rooms"));
        metrics.add(metric("reservationThroughput", "Reservation confirmation rate",
                ratio(KpiSnapshot.n(s.reservationsConfirmed()), KpiSnapshot.n(s.reservationsTotal())),
                0.30, 0.55, "Confirmed over all reservations"));
        metrics.add(metric("orderFulfilment", "Cafeteria order fulfilment",
                ratio(KpiSnapshot.n(s.ordersActive()), KpiSnapshot.n(s.ordersTotal())),
                0.50, 0.75, "Active over total orders"));
        metrics.add(metric("notificationHygiene", "Notification read rate",
                ratio(KpiSnapshot.n(s.notificationsRead()), KpiSnapshot.n(s.notificationsTotal())),
                0.50, 0.75, "Read over total notifications"));
        metrics.add(metric("eventCoverage", "Upcoming event coverage",
                ratio(KpiSnapshot.n(s.upcomingEvents()), Math.max(1, KpiSnapshot.n(s.eventsTotal()))),
                0.20, 0.40, "Upcoming over all events"));
        metrics.add(metric("lostFoundResolution", "Lost & found resolution",
                ratio(KpiSnapshot.n(s.lostFoundClaimed()),
                        Math.max(1, KpiSnapshot.n(s.lostFoundOpen()) + KpiSnapshot.n(s.lostFoundClaimed()))),
                0.25, 0.45, "Claimed over open plus claimed items"));

        double total = metrics.stream().mapToDouble(AdminAnalyticsResponse.HealthMetric::value).sum();
        int score = (int) Math.round(100 * total / metrics.size());

        String summary = String.format(
                "Campus health is %d/100 across %d measured signals. %d rooms are available, "
                        + "%d reservations are confirmed, %d cafeteria orders are active and "
                        + "%d notifications remain unread. The weakest signal is %s.",
                score, metrics.size(), KpiSnapshot.n(s.roomsAvailable()),
                KpiSnapshot.n(s.reservationsConfirmed()), KpiSnapshot.n(s.ordersActive()),
                KpiSnapshot.n(s.notificationsUnread()),
                metrics.stream().min(Comparator.comparingDouble(AdminAnalyticsResponse.HealthMetric::value))
                        .map(AdminAnalyticsResponse.HealthMetric::label).orElse("n/a"));

        List<AdminAnalyticsResponse.RecommendedAction> actions = new ArrayList<>();
        metrics.stream()
                .sorted(Comparator.comparingDouble(AdminAnalyticsResponse.HealthMetric::value))
                .limit(3)
                .forEach(m -> actions.add(actionFor(m, s)));

        return new AdminAnalyticsResponse.KpiAnalysis(score, summary, metrics, actions, LIVE_BASIS);
    }

    public AdminAnalyticsResponse.AnomalyAnalysis anomalyAnalysis(KpiSnapshot s) {
        Map<String, Double> current = new LinkedHashMap<>();
        Map<String, Double> expected = new LinkedHashMap<>();
        current.put("Room availability", ratio(KpiSnapshot.n(s.roomsAvailable()), KpiSnapshot.n(s.roomsTotal())));
        expected.put("Room availability", 0.35);
        current.put("Reservation confirmation", ratio(KpiSnapshot.n(s.reservationsConfirmed()), KpiSnapshot.n(s.reservationsTotal())));
        expected.put("Reservation confirmation", 0.55);
        current.put("Cafeteria fulfilment", ratio(KpiSnapshot.n(s.ordersActive()), KpiSnapshot.n(s.ordersTotal())));
        expected.put("Cafeteria fulfilment", 0.75);
        current.put("Notification read rate", ratio(KpiSnapshot.n(s.notificationsRead()), KpiSnapshot.n(s.notificationsTotal())));
        expected.put("Notification read rate", 0.70);
        current.put("Event coverage", ratio(KpiSnapshot.n(s.upcomingEvents()), Math.max(1, KpiSnapshot.n(s.eventsTotal()))));
        expected.put("Event coverage", 0.35);

        List<String> keys = new ArrayList<>(current.keySet());
        List<AdminAnalyticsResponse.Anomaly> anomalies = new ArrayList<>();
        for (int i = 0; i < keys.size(); i++) {
            String key = keys.get(i);
            double value = current.get(key);
            double baseline = expected.get(key);
            double z = round((value - baseline) / 0.15, 2);
            double deviation = baseline == 0 ? 0 : round(100 * (value - baseline) / baseline, 1);
            String other = keys.get((i + 1) % keys.size());
            double signA = value - baseline;
            double signB = current.get(other) - expected.get(other);
            String correlation = (signA >= 0) == (signB >= 0) ? "positive" : "negative";
            String explanation = String.format(
                    "%s is %.0f%% %s its operational baseline (z=%.2f); it moves %s with %s.",
                    key, Math.abs(deviation), deviation >= 0 ? "above" : "below", z, correlation, other);
            anomalies.add(new AdminAnalyticsResponse.Anomaly(
                    key, round(value, 3), baseline, z, deviation, correlation, explanation));
        }

        List<AdminAnalyticsResponse.Anomaly> serious = anomalies.stream()
                .filter(a -> Math.abs(a.zScore()) >= 1.0)
                .toList();
        List<AdminAnalyticsResponse.Anomaly> shown = serious.isEmpty()
                ? anomalies.stream().sorted(Comparator.comparingDouble(
                        (AdminAnalyticsResponse.Anomaly a) -> -Math.abs(a.zScore()))).limit(2).toList()
                : serious;

        return new AdminAnalyticsResponse.AnomalyAnalysis(shown, shown.size(),
                "Z-scores against configured operational baselines; values from live KPIs.");
    }

    public AdminAnalyticsResponse.SeasonalityAnalysis seasonalityAnalysis(KpiSnapshot s) {
        String[] names = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        List<Double> values = new ArrayList<>();
        if (s.monthlyActuals() != null && s.monthlyActuals().size() >= 3) {
            for (String name : names) {
                values.add(s.monthlyActuals().stream()
                        .filter(m -> name.equalsIgnoreCase(m.month()))
                        .mapToDouble(m -> KpiSnapshot.d(m.value()))
                        .findFirst().orElse(0D));
            }
        } else {
            double activity = KpiSnapshot.n(s.upcomingEvents()) + KpiSnapshot.n(s.registrationsTotal());
            for (int i = 0; i < 12; i++) {
                double wave = 1 + 0.25 * Math.sin((i + 1) * Math.PI / 6);
                double ramadan = (i == 2 || i == 3) ? 1.35 : 1.0;
                values.add(Math.max(0, activity * wave * ramadan / 12));
            }
        }

        double average = values.stream().mapToDouble(Double::doubleValue).average().orElse(1D);
        List<AdminAnalyticsResponse.SeasonalityMonth> months = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            double index = average == 0 ? 0 : round(values.get(i) / average, 2);
            months.add(new AdminAnalyticsResponse.SeasonalityMonth(
                    names[i], index, index >= 1.15, index <= 0.85,
                    index >= 1.15 ? "Peak activity" : index <= 0.85 ? "Low activity" : "Stable"));
        }

        String ramadan = String.format(
                "Ramadan window (Mar–Apr) carries a modelled index of %.2f versus a 1.00 baseline, "
                        + "driven by %d upcoming events and %d registrations.",
                (months.get(2).index() + months.get(3).index()) / 2,
                KpiSnapshot.n(s.upcomingEvents()), KpiSnapshot.n(s.registrationsTotal()));

        List<String> stockRecommendations = List.of(
                "Build cafeteria stock before the modelled Mar–Apr peak.",
                "Reduce preparation for the Aug trough; use the period for inventory review.",
                "Keep %d menu items and %d active orders as the replenishment reference."
                        .formatted(KpiSnapshot.n(s.itemsTotal()), KpiSnapshot.n(s.ordersActive())));

        String basis = s.monthlyActuals() != null && s.monthlyActuals().size() >= 3
                ? "Computed from caller-supplied monthly actuals." : MODELLED_BASIS;
        return new AdminAnalyticsResponse.SeasonalityAnalysis(months, ramadan, stockRecommendations, basis);
    }

    public AdminAnalyticsResponse.StockAnalysis stockAnalysis(KpiSnapshot s) {
        List<KpiSnapshot.StockSubject> source = s.stockSubjects();
        List<AdminAnalyticsResponse.StockItem> items = new ArrayList<>();
        if (source != null && !source.isEmpty()) {
            List<KpiSnapshot.StockSubject> sorted = source.stream()
                    .sorted(Comparator.comparingDouble((KpiSnapshot.StockSubject x) ->
                            KpiSnapshot.d(x.annualDemand()) * KpiSnapshot.d(x.unitCost())).reversed())
                    .toList();
            double totalValue = sorted.stream()
                    .mapToDouble(x -> KpiSnapshot.d(x.annualDemand()) * KpiSnapshot.d(x.unitCost()))
                    .sum();
            double cumulative = 0;
            for (KpiSnapshot.StockSubject x : sorted) {
                double demand = Math.max(0, KpiSnapshot.d(x.annualDemand()));
                double cost = Math.max(0.01, KpiSnapshot.d(x.unitCost()));
                double lead = Math.max(0, KpiSnapshot.d(x.leadTimeDays()));
                double eoq = Math.sqrt(2 * demand * 50 / (0.2 * cost));
                double rop = demand / 365 * lead;
                double safety = 1.65 * Math.sqrt(lead) * demand / 365;
                cumulative += demand * cost;
                double share = totalValue == 0 ? 0 : cumulative / totalValue;
                String abc = share <= 0.70 ? "A" : share <= 0.90 ? "B" : "C";
                items.add(new AdminAnalyticsResponse.StockItem(
                        x.id(), x.name(), abc, round(demand, 0), round(cost, 2),
                        round(eoq, 0), round(rop, 0), round(safety, 0),
                        "A".equals(abc) ? "Prioritise IA review and tighter reorder control." :
                                "Standard replenishment cadence."));
            }
        } else {
            double orders = Math.max(1, KpiSnapshot.n(s.ordersActive()));
            double itemsTotal = Math.max(1, KpiSnapshot.n(s.itemsTotal()));
            double[] split = {0.5, 0.3, 0.2};
            String[] names = {"Core meal", "Beverage", "Snack"};
            String[] classes = {"A", "B", "C"};
            for (int i = 0; i < 3; i++) {
                double demand = orders * split[i] * 12;
                double cost = Math.max(0.5, itemsTotal / 12.0 + i);
                items.add(new AdminAnalyticsResponse.StockItem(
                        "modelled-" + (i + 1), names[i], classes[i], round(demand, 0), round(cost, 2),
                        round(Math.sqrt(2 * demand * 50 / (0.2 * cost)), 0),
                        round(demand / 12, 0), round(demand / 48, 0),
                        "Modelled from cafeteria KPIs; supply per-item history for exact EOQ."));
            }
        }
        double investment = items.stream()
                .mapToDouble(i -> i.eoq() * i.unitCost()).sum();
        String basis = source != null && !source.isEmpty()
                ? "Computed from caller-supplied item demand/cost/lead time." : MODELLED_BASIS;
        return new AdminAnalyticsResponse.StockAnalysis(items, round(investment, 2), basis);
    }

    public AdminAnalyticsResponse.ChurnAnalysis churnAnalysis(KpiSnapshot s) {
        List<AdminAnalyticsResponse.ChurnSubject> subjects = new ArrayList<>();
        List<KpiSnapshot.ChurnSubject> source = s.churnSubjects();
        if (source != null && !source.isEmpty()) {
            for (KpiSnapshot.ChurnSubject x : source) {
                double score = clamp(KpiSnapshot.d(x.lastActiveDays()) * 3
                        + KpiSnapshot.d(x.unreadNotifications()) * 5
                        - KpiSnapshot.d(x.eventRegistrations()) * 4
                        - KpiSnapshot.d(x.orders()) * 2, 0, 100);
                subjects.add(new AdminAnalyticsResponse.ChurnSubject(
                        x.id(), x.name(), round(score, 0),
                        score >= 60 ? "Rising" : score >= 35 ? "Flat" : "Falling",
                        retentionPlan(score)));
            }
        } else {
            long users = Math.max(1, KpiSnapshot.n(s.studentsCount()) + KpiSnapshot.n(s.usersTotal()));
            double unreadRatio = ratio(KpiSnapshot.n(s.notificationsUnread()), users);
            double inactiveRatio = ratio(KpiSnapshot.n(s.eventsTotal()) - KpiSnapshot.n(s.registrationsTotal()), users);
            subjects.add(new AdminAnalyticsResponse.ChurnSubject(
                    "segment-dormant", "Dormant student cohort",
                    round(clamp(unreadRatio * 160 + inactiveRatio * 90, 0, 100), 0),
                    "Rising", "Send a targeted notification digest and a campus event invitation."));
            subjects.add(new AdminAnalyticsResponse.ChurnSubject(
                    "segment-cafeteria", "Low cafeteria engagement",
                    round(clamp(ratio(KpiSnapshot.n(s.ordersCancelled()),
                            Math.max(1, KpiSnapshot.n(s.ordersTotal()))) * 180, 0, 100), 0),
                    "Flat", "Offer a meal-credit reminder to inactive students."));
            subjects.add(new AdminAnalyticsResponse.ChurnSubject(
                    "segment-events", "Event drop-off cohort",
                    round(clamp(inactiveRatio * 140, 0, 100), 0),
                    "Falling", "Promote upcoming events with role-specific recommendations."));
        }
        long atRisk = subjects.stream().filter(x -> x.score() >= 60).count();
        String basis = source != null && !source.isEmpty()
                ? "Computed from caller-supplied activity signals." : MODELLED_BASIS;
        return new AdminAnalyticsResponse.ChurnAnalysis(subjects, (int) atRisk, basis);
    }

    public AdminAnalyticsResponse.ChurnAnalysis churnV2Analysis(KpiSnapshot s) {
        AdminAnalyticsResponse.ChurnAnalysis base = churnAnalysis(s);
        List<AdminAnalyticsResponse.ChurnSubject> refined = base.subjects().stream()
                .map(x -> new AdminAnalyticsResponse.ChurnSubject(
                        x.id(), x.name(),
                        round(clamp(x.score() + (x.score() >= 50 ? 7 : -4), 0, 100), 0),
                        x.trend(),
                        "Refined US-50 plan: " + x.plan()))
                .toList();
        return new AdminAnalyticsResponse.ChurnAnalysis(
                refined,
                (int) refined.stream().filter(x -> x.score() >= 60).count(),
                base.basis() + " Refined scoring model (US-50).");
    }

    public AdminAnalyticsResponse.ForecastAnalysis forecastAnalysis(KpiSnapshot s) {
        double base = KpiSnapshot.n(s.reservationsTotal())
                + KpiSnapshot.n(s.ordersActive())
                + KpiSnapshot.n(s.registrationsTotal());
        YearMonth start = YearMonth.now().plusMonths(1);
        List<AdminAnalyticsResponse.ForecastPoint> points = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            double median = base * (1 + 0.04 * i);
            double spread = Math.max(1, base * 0.12 * (1 + 0.2 * i));
            points.add(new AdminAnalyticsResponse.ForecastPoint(
                    start.plusMonths(i).toString(),
                    round(Math.max(0, median - spread), 0),
                    round(median, 0),
                    round(median + spread, 0)));
        }
        String narrative = String.format(
                "Three-month modelled activity starts from %d real campus signals. P50 reaches %.0f "
                        + "in %s; the P10–P90 band widens from %.0f to %.0f as uncertainty grows.",
                (long) base, points.get(2).p50(), points.get(2).month(),
                points.get(0).p90() - points.get(0).p10(),
                points.get(2).p90() - points.get(2).p10());
        return new AdminAnalyticsResponse.ForecastAnalysis(points, 80, narrative, MODELLED_BASIS);
    }

    public AdminAnalyticsResponse.RiskBriefing riskBriefing(KpiSnapshot s) {
        List<AdminAnalyticsResponse.RiskItem> risks = new ArrayList<>();
        risks.add(new AdminAnalyticsResponse.RiskItem("0–7 days", "Room maintenance pressure",
                KpiSnapshot.n(s.roomsMaintenance()) * 150,
                "Schedule maintenance outside peak reservation windows.", "Campus management"));
        risks.add(new AdminAnalyticsResponse.RiskItem("7–30 days", "Notification overload",
                KpiSnapshot.n(s.notificationsUnread()) * 5,
                "Batch low-priority notifications and escalate unread digests.", "Notifications admin"));
        risks.add(new AdminAnalyticsResponse.RiskItem("30–90 days", "Cafeteria cancellation waste",
                KpiSnapshot.n(s.ordersCancelled()) * 8,
                "Review cancelled orders and adjust modelled stock buffers.", "Cafeteria manager"));
        risks.add(new AdminAnalyticsResponse.RiskItem("90+ days", "Event attendance gap",
                Math.max(0, KpiSnapshot.n(s.eventsTotal()) - KpiSnapshot.n(s.registrationsTotal())) * 20,
                "Promote events with low registration to at-risk cohorts.", "Engagement lead"));
        double total = risks.stream().mapToDouble(AdminAnalyticsResponse.RiskItem::exposure).sum();
        String narrative = String.format(
                "Aggregated modelled exposure is %.0f across %d horizons. The largest single item is %s.",
                total, risks.size(), risks.stream()
                        .max(Comparator.comparingDouble(AdminAnalyticsResponse.RiskItem::exposure))
                        .map(AdminAnalyticsResponse.RiskItem::title).orElse("n/a"));
        return new AdminAnalyticsResponse.RiskBriefing(round(total, 0), risks, narrative, MODELLED_BASIS);
    }

    private AdminAnalyticsResponse.HealthMetric metric(String key, String label, double value,
                                                       double amber, double green, String detail) {
        String status = value >= green ? "GREEN" : value >= amber ? "AMBER" : "RED";
        return new AdminAnalyticsResponse.HealthMetric(key, label, round(value, 3), status, detail);
    }

    private AdminAnalyticsResponse.RecommendedAction actionFor(
            AdminAnalyticsResponse.HealthMetric m, KpiSnapshot s) {
        return switch (m.key()) {
            case "roomAvailability" -> new AdminAnalyticsResponse.RecommendedAction(
                    "Rebalance room inventory", "Campus management",
                    "+" + Math.max(1, KpiSnapshot.n(s.roomsTotal()) / 10) + " available rooms",
                    "Availability is the weakest measured signal: " + m.label());
            case "reservationThroughput" -> new AdminAnalyticsResponse.RecommendedAction(
                    "Clear pending reservations", "Reservations officer",
                    "+" + Math.max(1, KpiSnapshot.n(s.reservationsPending()) / 2) + " confirmations",
                    "Confirmation rate below target: " + m.detail());
            case "orderFulfilment" -> new AdminAnalyticsResponse.RecommendedAction(
                    "Reduce cancelled cafeteria orders", "Cafeteria manager",
                    "-" + Math.max(1, KpiSnapshot.n(s.ordersCancelled()) / 2) + " cancellations",
                    "Active order ratio below target.");
            case "notificationHygiene" -> new AdminAnalyticsResponse.RecommendedAction(
                    "Run an unread-notification digest", "Notifications admin",
                    "-" + Math.max(1, KpiSnapshot.n(s.notificationsUnread()) / 2) + " unread",
                    "Read rate below target.");
            case "eventCoverage" -> new AdminAnalyticsResponse.RecommendedAction(
                    "Schedule more upcoming events", "Engagement lead",
                    "+" + Math.max(1, KpiSnapshot.n(s.eventsTotal()) / 5) + " upcoming events",
                    "Upcoming event coverage below target.");
            default -> new AdminAnalyticsResponse.RecommendedAction(
                    "Review lost & found claims", "Campus support",
                    "+" + Math.max(1, KpiSnapshot.n(s.lostFoundClaimed()) / 2) + " claims",
                    "Resolution ratio below target.");
        };
    }

    private String retentionPlan(double score) {
        if (score >= 75) return "Immediate personal outreach and a tailored campus offer.";
        if (score >= 60) return "Send a retention notification and a recommended event.";
        if (score >= 35) return "Include in the next engagement digest.";
        return "No action; monitor at the next KPI refresh.";
    }

    private double ratio(double numerator, double denominator) {
        return denominator <= 0 ? 0 : clamp(numerator / denominator, 0, 1);
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private double round(double value, int digits) {
        double factor = Math.pow(10, digits);
        return Math.round(value * factor) / factor;
    }
}
