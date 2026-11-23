import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthService } from './auth.service';

const BASE = environment.apiBaseUrl;

const session = (accessToken: string) => ({
  accessToken,
  expiresIn: 900,
  user: {
    id: 'u1',
    fullName: 'Sami Benali',
    email: 'sami.benali@campus.tn',
    role: 'ADMINISTRATOR',
    totpEnabled: true,
  },
});

describe('live cookie session', () => {
  let httpMock: HttpTestingController;
  let auth: AuthService;
  let originalUseMocks: boolean;

  beforeEach(() => {
    originalUseMocks = environment.useMocks;
    environment.useMocks = false;
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    environment.useMocks = originalUseMocks;
    localStorage.clear();
    httpMock.verify();
  });

  it('restores the session from the refresh cookie without a localStorage token', async () => {
    const init = auth.init();
    const request = httpMock.expectOne(`${BASE}/auth/refresh`);

    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('X-CSRF-Protected')).toBe('1');

    request.flush(session('access-1'));
    await init;

    expect(auth.accessToken()).toBe('access-1');
    expect(auth.currentUser()?.role).toBe('ADMINISTRATOR');
    expect(auth.isAdmin()).toBeTrue();
    expect(localStorage.getItem('smart-campus.auth.token')).toBeNull();
  });

  it('keeps every gateway request credentialed and retries once after a refresh', () => {
    TestBed.inject(HttpClient).get(`${BASE}/rooms`).subscribe();
    const initial = httpMock.expectOne(`${BASE}/rooms`);
    expect(initial.request.withCredentials).toBeTrue();
    initial.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne(`${BASE}/auth/refresh`);
    expect(refresh.request.withCredentials).toBeTrue();
    expect(refresh.request.headers.get('X-CSRF-Protected')).toBe('1');
    refresh.flush(session('access-2'));

    const retry = httpMock.expectOne(`${BASE}/rooms`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer access-2');
    expect(retry.request.withCredentials).toBeTrue();
    retry.flush([]);
  });

  it('does not issue a session until the MFA challenge is verified', async () => {
    const login = auth.login('student@campus.tn', 'secret123');
    const challenge = httpMock.expectOne(`${BASE}/auth/login`);
    expect(challenge.request.withCredentials).toBeTrue();
    expect(challenge.request.headers.get('X-CSRF-Protected')).toBe('1');
    challenge.flush({
      mfaRequired: true,
      setupRequired: false,
      challengeId: 'ch-1',
      userId: 'u1',
    });

    expect(await login).toEqual({ ok: false, reason: 'otp-required' });
    expect(auth.pendingMfaChallenge).toBe('ch-1');
    expect(auth.isAuthenticated()).toBeFalse();

    const verify = auth.verifyOtp('123456');
    const verifyRequest = httpMock.expectOne(`${BASE}/auth/mfa/verify`);
    expect(verifyRequest.request.headers.get('X-CSRF-Protected')).toBe('1');
    verifyRequest.flush(session('access-3'));

    expect(await verify).toEqual({ ok: true });
    expect(auth.pendingMfaChallenge).toBeNull();
    expect(auth.isAuthenticated()).toBeTrue();
    expect(localStorage.getItem('smart-campus.auth.token')).toBeNull();
  });

  it('fetches a real TOTP secret for first-time enrolment', async () => {
    const login = auth.login('new@campus.tn', 'secret123');
    httpMock.expectOne(`${BASE}/auth/login`).flush({
      mfaRequired: true,
      setupRequired: true,
      challengeId: 'ch-2',
      userId: 'u2',
    });
    // firstValueFrom resolves in a microtask; let the setup call be issued.
    await Promise.resolve();
    await Promise.resolve();

    const setup = httpMock.expectOne(`${BASE}/auth/mfa/setup`);
    expect(setup.request.withCredentials).toBeTrue();
    setup.flush({ secret: 'JBSWY3DPEHPK3PXP', otpauthUri: 'otpauth://totp/Smart%20Campus?secret=JBSWY3DPEHPK3PXP' });

    expect(await login).toEqual({ ok: false, reason: 'setup-required' });
    expect(auth.pendingUser()?.totpSecret).toBe('JBSWY3DPEHPK3PXP');
    expect(auth.otpAuthUri(auth.pendingUser()!)).toContain('otpauth://totp/');
  });
});
