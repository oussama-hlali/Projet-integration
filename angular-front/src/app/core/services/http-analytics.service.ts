import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RuntimeConfigService } from '../config/runtime-config.service';

/**
 * SCRUM-109 (PB-37) — HTTP implementation of the admin KPIs.
 * Calls the per-service KPI endpoints instead of computing from mock stores.
 */
@Injectable({ providedIn: 'root' })
export class HttpAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private base(): string { return this.cfg.apiBaseUrl(); }

  campusKpi(): Observable<any> {
    return this.http.get(`${this.base()}/campus/kpi`).pipe(catchError(() => of({})));
  }

  engagementKpi(): Observable<any> {
    return this.http.get(`${this.base()}/engagement/kpi`).pipe(catchError(() => of({})));
  }

  cafeteriaKpi(): Observable<any> {
    return this.http.get(`${this.base()}/cafeteria/kpi`).pipe(catchError(() => of({})));
  }

  notificationsKpi(): Observable<any> {
    return this.http.get(`${this.base()}/notifications/kpi`).pipe(catchError(() => of({})));
  }

  /** Fetch all KPIs in parallel. */
  allKpis(): Observable<Record<string, any>> {
    return forkJoin({
      campus: this.campusKpi(),
      engagement: this.engagementKpi(),
      cafeteria: this.cafeteriaKpi(),
      notifications: this.notificationsKpi(),
    });
  }
}
