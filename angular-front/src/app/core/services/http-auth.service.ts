import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';

/**
 * SCRUM-104 — HTTP implementation of the identity/user flows.
 * Mirror of AuthService but backed by the gateway. Used when `useMocks === false`.
 */
@Injectable({ providedIn: 'root' })
export class HttpAuthService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);

  private base(): string { return this.cfg.apiBaseUrl(); }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.base()}/auth/login`, { email, password });
  }

  register(fullName: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.base()}/auth/register`, { fullName, email, password });
  }

  verifyMfa(challengeId: string, code: string): Observable<any> {
    return this.http.post(`${this.base()}/auth/mfa/verify`, { challengeId, code });
  }

  refresh(refreshToken: string): Observable<any> {
    return this.http.post(`${this.base()}/auth/refresh`, { refreshToken });
  }

  me(): Observable<any> {
    return this.http.get(`${this.base()}/users/me`);
  }

  mfaSetup(userId: string): Observable<{ secret: string; otpauthUri: string }> {
    return this.http.get<{ secret: string; otpauthUri: string }>(`${this.base()}/auth/mfa/setup?userId=${userId}`);
  }
}
