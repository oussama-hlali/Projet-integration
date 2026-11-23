package com.smartcampus.ai.service;

import com.smartcampus.ai.dto.AdminAnalyticsResponse;
import com.smartcampus.ai.dto.KpiSnapshot;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminAnalyticsServiceTest {

    private final AdminAnalyticsService service = new AdminAnalyticsService();

    @Test
    void kpiAnalysisUsesLiveKpisAndReturnsThreeActions() {
        AdminAnalyticsResponse.KpiAnalysis result = service.kpiAnalysis(snapshot());

        assertThat(result.healthScore()).isBetween(0, 100);
        assertThat(result.metrics()).hasSize(6);
        assertThat(result.actions()).hasSize(3);
        assertThat(result.basis()).contains("live per-service KPI");
        assertThat(result.metrics()).allSatisfy(m ->
                assertThat(m.status()).isIn("GREEN", "AMBER", "RED"));
    }

    @Test
    void seasonalityMarksProjectionWhenNoHistorySupplied() {
        AdminAnalyticsResponse.SeasonalityAnalysis result = service.seasonalityAnalysis(snapshot());

        assertThat(result.months()).hasSize(12);
        assertThat(result.basis()).contains("Modelled projection");
        assertThat(result.ramadanEffect()).contains("Ramadan");
    }

    @Test
    void stockChurnForecastAndRiskReturnPopulatedShapes() {
        KpiSnapshot snapshot = snapshot();

        assertThat(service.stockAnalysis(snapshot).items()).hasSize(3);
        assertThat(service.churnAnalysis(snapshot).subjects()).hasSize(3);
        assertThat(service.churnV2Analysis(snapshot).subjects())
                .allSatisfy(s -> assertThat(s.plan()).startsWith("Refined US-50"));
        assertThat(service.forecastAnalysis(snapshot).points()).hasSize(3);
        assertThat(service.riskBriefing(snapshot).risks()).hasSize(4);
        assertThat(service.anomalyAnalysis(snapshot).anomalies()).isNotEmpty();
    }

    @Test
    void realProviderNarrativeOverridesWordingButKeepsComputedNumbers() {
        AnalyticsNarrativeService llm = mock(AnalyticsNarrativeService.class);
        when(llm.narrative(anyString(), anyString())).thenReturn("Model-written campus summary.");
        when(llm.suffix()).thenReturn(" Narrative generated with openai.");
        AdminAnalyticsService aiService = new AdminAnalyticsService(llm);
        KpiSnapshot snapshot = snapshot();

        AdminAnalyticsResponse.KpiAnalysis kpis = aiService.kpiAnalysis(snapshot);
        AdminAnalyticsResponse.ForecastAnalysis forecast = aiService.forecastAnalysis(snapshot);
        AdminAnalyticsResponse.RiskBriefing risk = aiService.riskBriefing(snapshot);

        assertThat(kpis.summary()).isEqualTo("Model-written campus summary.");
        assertThat(kpis.metrics()).hasSize(6);
        assertThat(kpis.healthScore()).isBetween(0, 100);
        assertThat(kpis.basis()).endsWith("Narrative generated with openai.");
        assertThat(forecast.narrative()).isEqualTo("Model-written campus summary.");
        assertThat(forecast.points()).hasSize(3);
        assertThat(risk.narrative()).isEqualTo("Model-written campus summary.");
        assertThat(risk.risks()).hasSize(4);
    }

    private KpiSnapshot snapshot() {
        return new KpiSnapshot(
                2L, 1L, 0L, 1L,
                10L, 4L, 3L, 2L, 1L,
                20L, 5L, 10L, 2L, 3L,
                7L, 3L,
                8L, 4L, 12L,
                5L, 3L, 2L,
                6L, 15L,
                30L, 4L, 26L,
                10L, 6L, 4L,
                null, null, null);
    }
}
