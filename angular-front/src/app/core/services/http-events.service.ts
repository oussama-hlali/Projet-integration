import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';

/**
 * SCRUM-106 — HTTP implementation of events, interests and registrations.
 */
@Injectable({ providedIn: 'root' })
export class HttpEventsService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private base(): string { return this.cfg.apiBaseUrl(); }

  events(category?: string, from?: string, to?: string): Observable<any[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any[]>(`${this.base()}/events`, { params });
  }

  get(id: string): Observable<any> { return this.http.get(`${this.base()}/events/${id}`); }

  toggleInterest(eventId: string, userId: string): Observable<{ interested: boolean }> {
    return this.http.put<{ interested: boolean }>(`${this.base()}/events/${eventId}/interest?userId=${userId}`, {});
  }

  myInterests(userId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.base()}/me/event-interests?userId=${userId}`);
  }

  forYou(userId: string, limit = 6): Observable<any[]> {
    const params = new HttpParams().set('userId', userId).set('limit', limit);
    return this.http.get<any[]>(`${this.base()}/events/for-you`, { params });
  }

  register(eventId: string, userId: string): Observable<{ id: string; qrCode: string }> {
    return this.http.post<{ id: string; qrCode: string }>(`${this.base()}/events/${eventId}/registrations?userId=${userId}`, {});
  }

  unregister(eventId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base()}/events/${eventId}/registrations/me?userId=${userId}`);
  }

  registrationCount(eventId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.base()}/events/${eventId}/registrations/count`);
  }
}
