import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';

@Injectable({ providedIn: 'root' })
export class HttpNotificationsService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private base(): string { return this.cfg.apiBaseUrl(); }

  list(userId: string): Observable<any[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<any[]>(`${this.base()}/notifications`, { params });
  }

  unreadCount(userId: string): Observable<{ count: number }> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<{ count: number }>(`${this.base()}/notifications/unread-count`, { params });
  }

  markRead(id: string, read: boolean): Observable<any> {
    return this.http.patch(`${this.base()}/notifications/${id}`, { read });
  }

  markAllRead(userId: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.post(`${this.base()}/notifications/read-all`, {}, { params });
  }

  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.base()}/notifications/${id}`); }

  clearAll(userId: string): Observable<void> {
    const params = new HttpParams().set('userId', userId);
    return this.http.delete<void>(`${this.base()}/notifications`, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class HttpTransportService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private base(): string { return this.cfg.apiBaseUrl(); }

  routes(): Observable<any[]> { return this.http.get<any[]>(`${this.base()}/transport/routes`); }

  stops(routeId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base()}/transport/routes/${routeId}/stops`);
  }

  departures(stopId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base()}/transport/stops/${stopId}/departures`);
  }
}
