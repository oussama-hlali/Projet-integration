package com.smartcampus.ai.controller;

import com.smartcampus.ai.dto.AdminAnalyticsResponse;
import com.smartcampus.ai.dto.KpiSnapshot;
import com.smartcampus.ai.service.AdminAnalyticsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * US-24/25/26/27/28/30/35/50 — admin-only AI analytics endpoints.
 * Role enforcement lives in {@code SecurityConfig} (/api/v1/ai/admin/**).
 */
@RestController
@RequestMapping("/api/v1/ai/admin")
public class AdminAnalyticsController {

    private final AdminAnalyticsService analytics;

    public AdminAnalyticsController(AdminAnalyticsService analytics) {
        this.analytics = analytics;
    }

    /** US-24 — global health score, tricolour metrics, executive summary and actions. */
    @PostMapping("/kpi-analysis")
    public AdminAnalyticsResponse.KpiAnalysis kpiAnalysis(@RequestBody KpiSnapshot snapshot) {
        return analytics.kpiAnalysis(snapshot);
    }

    /** US-25 — z-scores, percentage deviations and cross-flow explanations. */
    @PostMapping("/anomalies")
    public AdminAnalyticsResponse.AnomalyAnalysis anomalies(@RequestBody KpiSnapshot snapshot) {
        return analytics.anomalyAnalysis(snapshot);
    }

    /** US-26 — monthly seasonality indices, peaks/troughs, Ramadan effect, stock advice. */
    @PostMapping("/seasonality")
    public AdminAnalyticsResponse.SeasonalityAnalysis seasonality(@RequestBody KpiSnapshot snapshot) {
        return analytics.seasonalityAnalysis(snapshot);
    }

    /** US-28 — ABC classification, EOQ, ROP and dynamic safety stock. */
    @PostMapping("/stock-optimization")
    public AdminAnalyticsResponse.StockAnalysis stockOptimization(@RequestBody KpiSnapshot snapshot) {
        return analytics.stockAnalysis(snapshot);
    }

    /** US-27 — churn scores, trends and retention plans. */
    @PostMapping("/churn")
    public AdminAnalyticsResponse.ChurnAnalysis churn(@RequestBody KpiSnapshot snapshot) {
        return analytics.churnAnalysis(snapshot);
    }

    /** US-30 — three-month P10/P50/P90 projections and AI narrative. */
    @PostMapping("/forecast")
    public AdminAnalyticsResponse.ForecastAnalysis forecast(@RequestBody KpiSnapshot snapshot) {
        return analytics.forecastAnalysis(snapshot);
    }

    /** US-35 — aggregated executive risk briefing with financial exposure. */
    @PostMapping("/risk-briefing")
    public AdminAnalyticsResponse.RiskBriefing riskBriefing(@RequestBody KpiSnapshot snapshot) {
        return analytics.riskBriefing(snapshot);
    }

    /** US-50 — second churn scenario with refined scoring. */
    @PostMapping("/churn-v2")
    public AdminAnalyticsResponse.ChurnAnalysis churnV2(@RequestBody KpiSnapshot snapshot) {
        return analytics.churnV2Analysis(snapshot);
    }
}
