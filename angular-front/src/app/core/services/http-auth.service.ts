import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { SKIP_ERROR_TOAST } from '../interceptors/http-error.interceptor';

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMINISTRATOR' | 'STUDENT';
  totpEnabled: boolean;
  theme?: string;
  language?: string;
  notificationsEnabled?: boolean;
}

/** The refresh token is never in this payload — it lives in an HttpOnly cookie. */
export interface SessionResponse {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
}

/** Password verification result: no session is issued until MFA succeeds. */
export interface MfaChallenge {
  mfaRequired: boolean;
  setupRequired: boolean;
  challengeId: string;
  userId: string;
}

export interface MfaSetupResponse {
  secret: string;
  otpauthUri: string;
}

/**
 * SCRUM-104 — HTTP implementation of the identity flows.
 * All session calls are credentialed so the browser stores and replays the
 * HttpOnly refresh cookie set by the identity service through the gateway.
 */
@Injectable({ providedIn: 'root' })
export class HttpAuthService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);

  private base(): string {
    return this.cfg.apiBaseUrl();
  }

  private readonly withCookies = { withCredentials: true } as const;
  private readonly csrfHeaders = new HttpHeaders({ 'X-CSRF-Protected': '1' });
  private readonly silent = {
    context: new HttpContext().set(SKIP_ERROR_TOAST, true),
  } as const;

  /** State-changing calls carry the CSRF marker alongside the credentialed cookie. */
  private readonly write = {
    withCredentials: true,
    headers: this.csrfHeaders,
  } as const;

  private readonly silentWrite = {
    withCredentials: true,
    headers: this.csrfHeaders,
    context: new HttpContext().set(SKIP_ERROR_TOAST, true),
  } as const;

  login(email: string, password: string): Observable<MfaChallenge> {
    // Auth forms render their own inline error; avoid a duplicate toast.
    return this.http.post<MfaChallenge>(
      `${this.base()}/auth/login`,
      { email, password },
      this.silentWrite,
    );
  }

  register(fullName: string, email: string, password: string): Observable<any> {
    return this.http.post(
      `${this.base()}/auth/register`,
      { fullName, email, password },
      this.silentWrite,
    );
  }

  mfaSetup(challengeId: string): Observable<MfaSetupResponse> {
    return this.http.post<MfaSetupResponse>(
      `${this.base()}/auth/mfa/setup`,
      { challengeId },
      this.silentWrite,
    );
  }

  verifyMfa(challengeId: string, code: string): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(
      `${this.base()}/auth/mfa/verify`,
      { challengeId, code },
      this.silentWrite,
    );
  }

  /** Silent bootstrap/401 recovery. The cookie identifies the session. */
  refresh(): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(
      `${this.base()}/auth/refresh`,
      {},
      this.silentWrite,
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base()}/auth/logout`, {}, this.silentWrite);
  }

  me(): Observable<SessionUser> {
    return this.http.get<SessionUser>(`${this.base()}/users/me`, this.withCookies);
  }

  listUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base()}/users`, this.withCookies);
  }

  createUser(input: {
    fullName: string;
    email: string;
    password: string;
    role: 'ADMINISTRATOR' | 'STUDENT';
  }): Observable<any> {
    return this.http.post(`${this.base()}/users`, input, this.write);
  }

  updateUser(id: string, changes: Record<string, unknown>): Observable<any> {
    return this.http.patch(`${this.base()}/users/${id}`, changes, this.write);
  }

  resetPassword(id: string, password: string): Observable<any> {
    return this.http.post(`${this.base()}/users/${id}/password-reset`, { password }, this.write);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.base()}/users/${id}`, this.write);
  }

  updateProfile(fullName: string): Observable<any> {
    return this.http.patch(`${this.base()}/users/me`, { fullName }, this.write);
  }

  updatePreferences(preferences: {
    theme?: string;
    language?: string;
    notificationsEnabled?: boolean;
  }): Observable<any> {
    return this.http.patch(`${this.base()}/users/me/preferences`, preferences, this.write);
  }
}
