import { Component, computed, input } from '@angular/core';

import { BadgeVariant } from '../../shared/components';

export interface KpiChartItem {
  label: string;
  value: number;
  variant?: BadgeVariant;
}

/**
 * Accessible KPI bar chart.
 *
 * No charting library: each bar exposes a `progressbar` role with
 * `aria-valuenow` / `aria-valuemax` and a readable label, so the data is
 * available to screen readers and the bars are not the only signal. Values
 * are also printed as text next to each bar.
 */
@Component({
  selector: 'app-kpi-chart',
  templateUrl: './kpi-chart.component.html',
  styleUrl: './kpi-chart.component.scss',
})
export class KpiChartComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly items = input.required<readonly KpiChartItem[]>();

  protected readonly max = computed(() => Math.max(1, ...this.items().map((item) => item.value)));

  protected readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.value, 0),
  );

  protected width(value: number): number {
    return Math.round((value / this.max()) * 100);
  }

  protected variant(item: KpiChartItem): BadgeVariant {
    return item.variant ?? 'info';
  }
}
