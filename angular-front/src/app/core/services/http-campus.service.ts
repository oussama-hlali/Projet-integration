import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';

/**
 * SCRUM-105 — HTTP implementation of campus/rooms/reservations flows.
 */
@Injectable({ providedIn: 'root' })
export class HttpCampusService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private base(): string { return this.cfg.apiBaseUrl(); }

  rooms(buildingId?: string, status?: string, type?: string, minCapacity?: number, q?: string): Observable<any[]> {
    let params = new HttpParams();
    if (buildingId) params = params.set('buildingId', buildingId);
    if (status) params = params.set('status', status);
    if (type) params = params.set('type', type);
    if (minCapacity != null) params = params.set('minCapacity', minCapacity);
    if (q) params = params.set('q', q);
    return this.http.get<any[]>(`${this.base()}/rooms`, { params });
  }

  buildings(): Observable<any[]> { return this.http.get<any[]>(`${this.base()}/buildings`); }

  reservations(userId?: string, status?: string): Observable<any[]> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', userId);
    if (status) params = params.set('status', status);
    return this.http.get<any[]>(`${this.base()}/reservations`, { params });
  }

  createReservation(input: { roomId: string; userId: string; startTime: string; endTime: string; purpose: string }): Observable<any> {
    return this.http.post(`${this.base()}/reservations`, input);
  }

  cancelReservation(id: string): Observable<any> {
    return this.http.post(`${this.base()}/reservations/${id}/cancel`, {});
  }

  availability(roomId: string, from: string, to: string): Observable<{ available: boolean }> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<{ available: boolean }>(`${this.base()}/rooms/${roomId}/availability`, { params });
  }
}
