import { Component, inject } from '@angular/core';

import { AnalyticsService } from '../../core/services/analytics.service';
import { PageHeaderComponent, StatCardComponent } from '../../shared/components';

@Component({
  selector: 'app-admin',
  imports: [PageHeaderComponent, StatCardComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  protected readonly analytics = inject(AnalyticsService);

  protected percent(value: number): string {
    return `${Math.round(value * 100)}%`;
  }
}
