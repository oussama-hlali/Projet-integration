import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';
import {
  AnomalyAnalysis,
  ChurnAnalysis,
  ForecastAnalysis,
  KpiAnalysis,
  RiskBriefing,
  SeasonalityAnalysis,
  StockAnalysis,
} from '../models/admin-analytics.model';

/**
 * SCRUM-130 — admin AI analytics (US-24/25/26/27/28/30/35/50).
 * All endpoints are protected by ADMINISTRATOR role checks in the AI service.
 */
@Injectable({ providedIn: 'root' })
export class HttpAdminAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);

  private base(): string {
    return `${this.cfg.apiBaseUrl()}/ai/admin`;
  }

  private post<T>(path: string, snapshot: Record<string, number>): Observable<T> {
    return this.http.post<T>(`${this.base()}/${path}`, snapshot);
  }

  kpiAnalysis(snapshot: Record<string, number>): Observable<KpiAnalysis> {
    return this.post<KpiAnalysis>('kpi-analysis', snapshot);
  }

  anomalies(snapshot: Record<string, number>): Observable<AnomalyAnalysis> {
    return this.post<AnomalyAnalysis>('anomalies', snapshot);
  }

  seasonality(snapshot: Record<string, number>): Observable<SeasonalityAnalysis> {
    return this.post<SeasonalityAnalysis>('seasonality', snapshot);
  }

  stockOptimization(snapshot: Record<string, number>): Observable<StockAnalysis> {
    return this.post<StockAnalysis>('stock-optimization', snapshot);
  }

  churn(snapshot: Record<string, number>): Observable<ChurnAnalysis> {
    return this.post<ChurnAnalysis>('churn', snapshot);
  }

  churnV2(snapshot: Record<string, number>): Observable<ChurnAnalysis> {
    return this.post<ChurnAnalysis>('churn-v2', snapshot);
  }

  forecast(snapshot: Record<string, number>): Observable<ForecastAnalysis> {
    return this.post<ForecastAnalysis>('forecast', snapshot);
  }

  riskBriefing(snapshot: Record<string, number>): Observable<RiskBriefing> {
    return this.post<RiskBriefing>('risk-briefing', snapshot);
  }
}
