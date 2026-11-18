import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';

/**
 * SCRUM-108 — HTTP implementation of lost-found + notifications + transport.
 */
@Injectable({ providedIn: 'root' })
export class HttpLostFoundService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private base(): string { return this.cfg.apiBaseUrl(); }

  list(status?: string, q?: string): Observable<any[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (q) params = params.set('q', q);
    return this.http.get<any[]>(`${this.base()}/lost-found`, { params });
  }

  get(id: string): Observable<any> { return this.http.get(`${this.base()}/lost-found/${id}`); }

  create(input: { title: string; description: string; status?: string; reporterId: string; taggedUserIds?: string[] }): Observable<any> {
    return this.http.post(`${this.base()}/lost-found`, input);
  }

  setStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.base()}/lost-found/${id}`, { status });
  }

  claim(id: string): Observable<any> { return this.http.post(`${this.base()}/lost-found/${id}/claim`, {}); }

  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.base()}/lost-found/${id}`); }

  addComment(postId: string, authorId: string, message: string, taggedUserIds?: string[]): Observable<any> {
    return this.http.post(`${this.base()}/lost-found/${postId}/comments`, { authorId, message, taggedUserIds });
  }

  comments(postId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base()}/lost-found/${postId}/comments`);
  }

  addReaction(postId: string, userId: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.put(`${this.base()}/lost-found/${postId}/reactions/me`, {}, { params });
  }

  removeReaction(postId: string, userId: string): Observable<void> {
    const params = new HttpParams().set('userId', userId);
    return this.http.delete<void>(`${this.base()}/lost-found/${postId}/reactions/me`, { params });
  }
}
