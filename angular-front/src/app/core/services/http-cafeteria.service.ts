import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';

/**
 * SCRUM-107 — HTTP implementation of cafeteria menus and orders.
 */
@Injectable({ providedIn: 'root' })
export class HttpCafeteriaService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private base(): string { return this.cfg.apiBaseUrl(); }

  menus(): Observable<any[]> { return this.http.get<any[]>(`${this.base()}/menus`); }
  today(): Observable<any> { return this.http.get(`${this.base()}/menus/today`); }
  menu(id: string): Observable<any> { return this.http.get(`${this.base()}/menus/${id}`); }
  items(menuId: string): Observable<any[]> { return this.http.get<any[]>(`${this.base()}/menus/${menuId}/items`); }

  orders(userId: string): Observable<any[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<any[]>(`${this.base()}/orders`, { params });
  }

  latest(userId: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get(`${this.base()}/orders/latest`, { params });
  }

  reserve(menuId: string, itemId: string, userId: string, idempotencyKey?: string): Observable<any> {
    const headers = idempotencyKey ? new HttpHeaders({ 'Idempotency-Key': idempotencyKey }) : undefined;
    return this.http.post(`${this.base()}/orders`, { menuId, itemId, userId }, { headers });
  }

  cancel(orderId: string, userId: string): Observable<{ cancelled: boolean }> {
    const params = new HttpParams().set('userId', userId);
    return this.http.post<{ cancelled: boolean }>(`${this.base()}/orders/${orderId}/cancel`, {}, { params });
  }

  hasReserved(menuId: string, itemId: string, userId: string): Observable<{ reserved: boolean }> {
    const params = new HttpParams().set('menuId', menuId).set('itemId', itemId).set('userId', userId);
    return this.http.get<{ reserved: boolean }>(`${this.base()}/orders/has-reserved`, { params });
  }
}
