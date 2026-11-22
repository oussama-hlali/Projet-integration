package com.smartcampus.ai.dto;

import java.util.List;

/** Response shapes for the admin AI analytics endpoints (US-24 … US-50). */
public final class AdminAnalyticsResponse {

    private AdminAnalyticsResponse() {
    }

    public record HealthMetric(
            String key,
            String label,
            double value,
            String status,
            String detail) {
    }

    public record RecommendedAction(
            String title,
            String owner,
            String impact,
            String rationale) {
    }

    public record KpiAnalysis(
            int healthScore,
            String summary,
            List<HealthMetric> metrics,
            List<RecommendedAction> actions,
            String basis) {
    }

    public record Anomaly(
            String metric,
            double value,
            double expected,
            double zScore,
            double deviationPct,
            String correlation,
            String explanation) {
    }

    public record AnomalyAnalysis(
            List<Anomaly> anomalies,
            int total,
            String basis) {
    }

    public record SeasonalityMonth(
            String month,
            double index,
            boolean peak,
            boolean trough,
            String note) {
    }

    public record SeasonalityAnalysis(
            List<SeasonalityMonth> months,
            String ramadanEffect,
            List<String> stockRecommendations,
            String basis) {
    }

    public record StockItem(
            String id,
            String name,
            String abcClass,
            double annualDemand,
            double unitCost,
            double eoq,
            double reorderPoint,
            double safetyStock,
            String recommendation) {
    }

    public record StockAnalysis(
            List<StockItem> items,
            double totalInvestment,
            String basis) {
    }

    public record ChurnSubject(
            String id,
            String name,
            double score,
            String trend,
            String plan) {
    }

    public record ChurnAnalysis(
            List<ChurnSubject> subjects,
            int atRiskCount,
            String basis) {
    }

    public record ForecastPoint(
            String month,
            double p10,
            double p50,
            double p90) {
    }

    public record ForecastAnalysis(
            List<ForecastPoint> points,
            double confidence,
            String narrative,
            String basis) {
    }

    public record RiskItem(
            String horizon,
            String title,
            double exposure,
            String action,
            String owner) {
    }

    public record RiskBriefing(
            double totalExposure,
            List<RiskItem> risks,
            String narrative,
            String basis) {
    }
}
