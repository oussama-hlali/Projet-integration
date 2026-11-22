import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin, switchMap } from 'rxjs';

import { HttpAdminAnalyticsService } from '../../../core/services/http-admin-analytics.service';
import { HttpAnalyticsService } from '../../../core/services/http-analytics.service';
import { AdminAnalyticsBundle } from '../../../core/models/admin-analytics.model';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { BadgeVariant } from '../../../shared/components/status-badge.component';
import { KpiChartComponent, KpiChartItem } from '../kpi-chart.component';

type TabKey = 'kpi' | 'anomalies' | 'seasonality' | 'stock' | 'churn' | 'forecast' | 'risk' | 'churnV2';

interface AnalyticsTab {
  readonly key: TabKey;
  readonly label: string;
  readonly story: string;
}

/**
 * SCRUM-130 — admin-only AI analytics workspace.
 * The route is guarded by adminGuard and every backend endpoint independently
 * requires an ADMINISTRATOR JWT authority.
 */
@Component({
  selector: 'app-admin-ai-analytics',
  imports: [PageHeaderComponent, KpiChartComponent],
  templateUrl: './admin-ai-analytics.html',
  styleUrl: './admin-ai-analytics.scss',
})
export class AdminAiAnalytics {
  private readonly kpis = inject(HttpAnalyticsService);
  private readonly analytics = inject(HttpAdminAnalyticsService);

  protected readonly tabs: readonly AnalyticsTab[] = [
    { key: 'kpi', label: 'KPI intelligence', story: 'US-24' },
    { key: 'anomalies', label: 'Anomalies', story: 'US-25' },
    { key: 'seasonality', label: 'Seasonality', story: 'US-26' },
    { key: 'stock', label: 'Stock optimisation', story: 'US-28' },
    { key: 'churn', label: 'Churn prediction', story: 'US-27' },
    { key: 'forecast', label: 'Forecasts', story: 'US-30' },
    { key: 'risk', label: 'Risk briefing', story: 'US-35' },
    { key: 'churnV2', label: 'Churn (refined)', story: 'US-50' },
  ];

  protected readonly active = signal<TabKey>('kpi');
  protected readonly bundle = signal<AdminAnalyticsBundle | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly kpiChart = computed<readonly KpiChartItem[]>(() =>
    (this.bundle()?.kpi.metrics ?? []).map((metric) => ({
      label: metric.label,
      value: Math.round(metric.value * 100),
      variant: this.variant(metric.status),
    })),
  );

  protected readonly seasonalityChart = computed<readonly KpiChartItem[]>(() =>
    (this.bundle()?.seasonality.months ?? []).map((month) => ({
      label: month.month,
      value: Math.round(month.index * 100),
      variant: month.peak ? 'success' : month.trough ? 'danger' : 'info',
    })),
  );

  protected readonly forecastChart = computed<readonly KpiChartItem[]>(() =>
    (this.bundle()?.forecast.points ?? []).map((point) => ({
      label: point.month,
      value: Math.round(point.p50),
      variant: 'info',
    })),
  );

  constructor() {
    this.load();
  }

  protected select(key: TabKey): void {
    this.active.set(key);
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.kpis.allKpis()
      .pipe(
        switchMap((snapshot) => forkJoin({
          kpi: this.analytics.kpiAnalysis(snapshot),
          anomalies: this.analytics.anomalies(snapshot),
          seasonality: this.analytics.seasonality(snapshot),
          stock: this.analytics.stockOptimization(snapshot),
          churn: this.analytics.churn(snapshot),
          churnV2: this.analytics.churnV2(snapshot),
          forecast: this.analytics.forecast(snapshot),
          risk: this.analytics.riskBriefing(snapshot),
        })),
      )
      .subscribe({
        next: (bundle) => {
          this.bundle.set(bundle);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('AI analytics are unavailable. Check the gateway connection and your administrator access.');
          this.loading.set(false);
        },
      });
  }

  protected variant(status: string): BadgeVariant {
    return status === 'GREEN' ? 'success' : status === 'AMBER' ? 'warning' : 'danger';
  }

  protected pct(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  protected num(value: number): string {
    return Math.round(value).toLocaleString();
  }
}
