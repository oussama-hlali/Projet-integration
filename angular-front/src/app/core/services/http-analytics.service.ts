import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RuntimeConfigService } from '../config/runtime-config.service';

/**
 * SCRUM-109 (PB-37) — HTTP implementation of the admin KPIs.
 * Calls the per-service KPI endpoints instead of computing from mock stores.
 * Values start empty and only become non-zero once data is created through the
 * UI and persisted by the backend.
 */
@Injectable({ providedIn: 'root' })
export class HttpAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private base(): string { return this.cfg.apiBaseUrl(); }

  /** Last KPI snapshot; empty until the backend answers. */
  readonly data = signal<Record<string, number>>({});

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

  identityKpi(): Observable<any> {
    return this.http.get(`${this.base()}/identity/kpi`).pipe(catchError(() => of({})));
  }

  /** Fetch all KPIs in parallel and flatten them into one key/value snapshot. */
  allKpis(): Observable<Record<string, number>> {
    return forkJoin({
      campus: this.campusKpi(),
      engagement: this.engagementKpi(),
      cafeteria: this.cafeteriaKpi(),
      notifications: this.notificationsKpi(),
      identity: this.identityKpi(),
    }).pipe(
      map((groups) => {
        const flat: Record<string, number> = {};
        for (const group of Object.values(groups)) {
          for (const [key, value] of Object.entries(group ?? {})) {
            if (typeof value === 'number') flat[key] = value;
          }
        }
        return flat;
      }),
    );
  }

  /** Refresh the cached snapshot. Safe to call repeatedly (e.g. after a mutation). */
  refresh(): Observable<Record<string, number>> {
    return this.allKpis().pipe(map((snapshot) => { this.data.set(snapshot); return snapshot; }));
  }
}
