import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  HttpAuthService,
  MfaChallenge,
  MfaSetupResponse,
  SessionResponse,
  SessionUser,
} from './http-auth.service';
import { User } from '../models/user.model';
import { mapUser } from './live-mappers';
import { UserService } from './user.service';

const TOKEN_KEY = 'smart-campus.auth.token';
const LEGACY_ROLE_KEY = 'smart-campus.auth.role';
const JWT_SECRET = 'smart-campus-dev-secret-change-me';
const TOKEN_TTL_SECONDS = 24 * 60 * 60;
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const TOTP_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export type AuthResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'email-taken'
        | 'weak-password'
        | 'invalid-credentials'
        | 'otp-required'
        | 'setup-required'
        | 'invalid-otp'
        | 'no-pending';
    };

/**
 * Real (client-side) authentication with TOTP second factor.
 *
 * Passwords are never stored in plaintext. Sessions use a signed JWT-like
 * token persisted in localStorage. After a valid password, the user must
 * complete a TOTP challenge (Google Authenticator compatible) before a
 * session is issued.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly injector = inject(Injector);
  private userServiceInstance: UserService | null = null;
  /**
   * Resolve the directory lazily: `UserService` loads `/users` in its
   * constructor, and that call passes through the auth interceptor which also
   * injects `AuthService`. An eager field here would create a DI cycle at
   * bootstrap and silently swallow the live directory load.
   */
  private get userService(): UserService {
    return (this.userServiceInstance ??= this.injector.get(UserService));
  }
  private readonly httpAuth = inject(HttpAuthService);

  private readonly currentUserIdState = signal<string | null>(null);
  /** Cached user from HTTP login (for HTTP mode). */
  readonly httpUser = signal<User | null>(null);
  /** In-memory access token (no localStorage, per security guidelines). */
  readonly accessToken = signal<string | null>(null);
  private readonly pendingUserIdState = signal<string | null>(null);
  /** Live MFA identity comes from the challenge, not the mock directory. */
  private readonly pendingLiveUserState = signal<User | null>(null);
  /** Pending MFA challenge id from the backend. */
  pendingMfaChallenge: string | null = null;
  /** Cached otpauth URI for HTTP-mode TOTP setup. */
  pendingOtpauthUri: string | null = null;

  /** Currently signed-in user, or `null` when signed out. */
  readonly currentUser = computed<User | null>(() => {
    if (!environment.useMocks) {
      return this.httpUser();
    }
    const id = this.currentUserIdState();
    return id ? this.userService.findById(id) ?? null : null;
  });

  /** True when a valid session exists. */
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  /** Convenience flag for administrator-only surfaces. */
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMINISTRATOR');

  /** Landing page for the signed-in role: students and admins live apart. */
  readonly homeRoute = computed(() => (this.isAdmin() ? '/admin' : '/dashboard'));

  /** User awaiting the OTP challenge, if any. */
  readonly pendingUserId = this.pendingUserIdState.asReadonly();

  readonly pendingUser = computed<User | null>(() => {
    const live = this.pendingLiveUserState();
    if (live) {
      return live;
    }
    const id = this.pendingUserIdState();
    return id ? this.userService.findById(id) ?? null : null;
  });

  /**
   * Restore a session before the first navigation. The access token is rebuilt
   * in memory from the HttpOnly refresh cookie; no token is read from or written
   * to localStorage.
   */
  async init(): Promise<void> {
    for (const key of [TOKEN_KEY, LEGACY_ROLE_KEY]) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
    this.clearSession();
    this.pendingMfaChallenge = null;
    this.pendingOtpauthUri = null;
    this.pendingLiveUserState.set(null);

    if (environment.useMocks) {
      return;
    }

    try {
      this.applySession(await firstValueFrom(this.httpAuth.refresh()));
    } catch {
      // No valid cookie (first visit, logout, rotation replay) — guards own the redirect.
      this.clearSession();
    }
  }

  /** Sign in with email and password. May require OTP/setup afterwards. */
  async login(email: string, password: string): Promise<AuthResult> {
    if (!environment.useMocks) {
      try {
        return await this.startLiveMfa(email, password);
      } catch {
        return { ok: false, reason: 'invalid-credentials' };
      }
    }

    const user = this.userService.findByEmail(email);
    if (!user || !user.passwordHash || !user.salt || !user.totpSecret) {
      return { ok: false, reason: 'invalid-credentials' };
    }

    const hash = await this.sha256Hex(user.salt + password);
    if (hash !== user.passwordHash) {
      return { ok: false, reason: 'invalid-credentials' };
    }

    this.pendingUserIdState.set(user.id);
    return user.totpEnabled
      ? { ok: false, reason: 'otp-required' }
      : { ok: false, reason: 'setup-required' };
  }

  /**
   * Create a student account. OTP setup is required on first sign-in.
   *
   * Public self-registration is student-only: the role is fixed here and is
   * never taken from the form, so a visitor cannot sign themselves up as an
   * administrator. Only the admin console (`createManagedUser`) may do that.
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    if (!environment.useMocks) {
      try {
        await firstValueFrom(
          this.httpAuth.register(input.fullName.trim(), input.email.trim(), input.password),
        );
        // Registration does not issue a session: walk the new student through
        // the same mandatory TOTP enrolment as any other first login.
        return await this.startLiveMfa(input.email, input.password);
      } catch {
        return { ok: false, reason: 'email-taken' };
      }
    }

    const password = input.password ?? '';
    if (password.length < 8) {
      return { ok: false, reason: 'weak-password' };
    }

    if (this.userService.findByEmail(input.email)) {
      return { ok: false, reason: 'email-taken' };
    }

    const salt = this.generateSalt();
    const passwordHash = await this.sha256Hex(salt + password);
    const totpSecret = this.generateTotpSecret();

    // Drop any existing session so a newly registered student never inherits
    // the role of the account that happened to be signed in before.
    this.clearSession();

    const user = this.userService.add({
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      role: 'STUDENT',
      avatarUrl: 'assets/avatars/default.png',
      preferences: { language: 'fr', notificationsEnabled: true, theme: 'light' },
      passwordHash,
      salt,
      totpSecret,
      totpEnabled: false,
    });

    this.pendingUserIdState.set(user.id);
    return { ok: false, reason: 'setup-required' };
  }

  /**
   * Create an account from the admin console. The new user starts with 2FA
   * disabled so their first sign-in walks them through the setup flow.
   */
  async createManagedUser(input: {
    fullName: string;
    email: string;
    password: string;
    role: User['role'];
  }): Promise<{ ok: true; user: User } | { ok: false; reason: 'email-taken' | 'weak-password' }> {
    if ((input.password ?? '').length < 8) {
      return { ok: false, reason: 'weak-password' };
    }

    if (!environment.useMocks) {
      try {
        const row = await firstValueFrom(this.httpAuth.createUser({
          fullName: input.fullName.trim(),
          email: input.email.trim(),
          password: input.password,
          role: input.role,
        }));
        const user = mapUser(row);
        this.userService.cache(user);
        return { ok: true, user };
      } catch {
        return { ok: false, reason: 'email-taken' };
      }
    }

    if (this.userService.findByEmail(input.email)) {
      return { ok: false, reason: 'email-taken' };
    }

    const salt = this.generateSalt();
    const user = this.userService.add({
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      role: input.role,
      avatarUrl: 'assets/avatars/default.png',
      preferences: { language: 'fr', notificationsEnabled: true, theme: 'light' },
      passwordHash: await this.sha256Hex(salt + input.password),
      salt,
      totpSecret: this.generateTotpSecret(),
      totpEnabled: false,
    });

    return { ok: true, user };
  }

  /** Reset a user's password from the admin console. */
  async resetPassword(userId: string, password: string): Promise<boolean> {
    if (password.length < 8) {
      return false;
    }

    if (!environment.useMocks) {
      try {
        await firstValueFrom(this.httpAuth.resetPassword(userId, password));
        return true;
      } catch {
        return false;
      }
    }

    if (!this.userService.findById(userId)) {
      return false;
    }

    const salt = this.generateSalt();
    const passwordHash = await this.sha256Hex(salt + password);
    return this.userService.setCredentials(userId, passwordHash, salt) !== undefined;
  }

  /** Verify a TOTP code for an already enrolled user. */
  async verifyOtp(code: string): Promise<AuthResult> {
    if (!environment.useMocks) {
      if (!this.pendingMfaChallenge) {
        return { ok: false, reason: 'no-pending' };
      }
      try {
        const res = await firstValueFrom(
          this.httpAuth.verifyMfa(this.pendingMfaChallenge, code),
        );
        this.applySession(res);
        this.clearPendingMfa();
        return { ok: true };
      } catch {
        return { ok: false, reason: 'invalid-otp' };
      }
    }

    const user = this.pendingUser();
    if (!user || !user.totpSecret) {
      return { ok: false, reason: 'no-pending' };
    }

    if (!(await this.verifyTotp(user.totpSecret, code))) {
      return { ok: false, reason: 'invalid-otp' };
    }

    await this.startSession(user);
    this.pendingUserIdState.set(null);
    return { ok: true };
  }

  /** Confirm the first TOTP code and enable 2FA for the pending user. */
  async setupTotp(code: string): Promise<AuthResult> {
    if (!environment.useMocks) {
      const challengeId = this.pendingMfaChallenge;
      if (!challengeId) {
        return { ok: false, reason: 'no-pending' };
      }
      try {
        const res = await firstValueFrom(this.httpAuth.verifyMfa(challengeId, code));
        this.applySession(res);
        this.clearPendingMfa();
        return { ok: true };
      } catch {
        return { ok: false, reason: 'invalid-otp' };
      }
    }

    const user = this.pendingUser();
    if (!user || !user.totpSecret) {
      return { ok: false, reason: 'no-pending' };
    }

    if (!(await this.verifyTotp(user.totpSecret, code))) {
      return { ok: false, reason: 'invalid-otp' };
    }

    this.userService.setTotp(user.id, user.totpSecret, true);
    const updated = this.userService.findById(user.id);
    if (updated) {
      await this.startSession(updated);
    }
    this.pendingUserIdState.set(null);
    return { ok: true };
  }

  /** Cancel the in-progress OTP challenge. */
  cancelPending(): void {
    this.clearPendingMfa();
  }

  /** End the current session, revoking the cookie-backed refresh token too. */
  async logout(): Promise<void> {
    this.clearSession();
    this.clearPendingMfa();
    if (!environment.useMocks) {
      try {
        await firstValueFrom(this.httpAuth.logout());
      } catch {
        // Local state is already cleared; a stale cookie will fail its next refresh.
      }
    }
  }

  /** Real refresh used by the 401 interceptor; single-flight lives in the interceptor. */
  refresh(): Observable<string | null> {
    if (environment.useMocks) {
      return of(this.accessToken());
    }
    return this.httpAuth.refresh().pipe(
      map((res) => {
        this.applySession(res);
        return res.accessToken;
      }),
    );
  }

  /** Current TOTP code for a secret (demo helper). */
  async currentTotpCode(secret: string): Promise<string> {
    const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
    return this.totpCode(secret, counter);
  }

  /** Build the otpauth URI scanned by Google Authenticator. */
  otpAuthUri(user: User): string {
    if (!environment.useMocks && this.pendingOtpauthUri) {
      return this.pendingOtpauthUri;
    }
    const secret = user.totpSecret ?? '';
    const label = encodeURIComponent(`Smart Campus:${user.email}`);
    const issuer = encodeURIComponent('Smart Campus');
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
  }

  /**
   * Password verification always produces an MFA challenge. Enrolment secrets
   * are fetched here so the setup screen can render a real authenticator QR.
   */
  private async startLiveMfa(email: string, password: string): Promise<AuthResult> {
    const challenge: MfaChallenge = await firstValueFrom(this.httpAuth.login(email, password));
    if (!challenge.mfaRequired) {
      this.applySession(challenge as unknown as SessionResponse);
      return { ok: true };
    }

    this.pendingMfaChallenge = challenge.challengeId;
    this.pendingUserIdState.set(challenge.userId);

    const baseUser: User = {
      id: challenge.userId,
      fullName: email,
      email,
      role: 'STUDENT',
      avatarUrl: 'assets/avatars/default.png',
      preferences: { language: 'en', notificationsEnabled: true, theme: 'light' },
      passwordHash: '',
      salt: '',
      totpSecret: '',
      totpEnabled: !challenge.setupRequired,
    };

    if (!challenge.setupRequired) {
      this.pendingLiveUserState.set(baseUser);
      return { ok: false, reason: 'otp-required' };
    }

    const setup: MfaSetupResponse = await firstValueFrom(
      this.httpAuth.mfaSetup(challenge.challengeId),
    );
    this.pendingOtpauthUri = setup.otpauthUri;
    this.pendingLiveUserState.set({ ...baseUser, totpSecret: setup.secret, totpEnabled: false });
    return { ok: false, reason: 'setup-required' };
  }

  private clearPendingMfa(): void {
    this.pendingMfaChallenge = null;
    this.pendingOtpauthUri = null;
    this.pendingUserIdState.set(null);
    this.pendingLiveUserState.set(null);
  }

  /** Role-safe destination after login or MFA, preserving the original page. */
  postAuthDestination(returnUrl: string | null | undefined): string {
    const home = this.homeRoute();
    if (
      !returnUrl ||
      returnUrl === '/login' ||
      returnUrl.startsWith('/verify-otp') ||
      returnUrl.startsWith('/setup-2fa')
    ) {
      return home;
    }
    const wantsAdmin = returnUrl.startsWith('/admin');
    return wantsAdmin === this.isAdmin() ? returnUrl : home;
  }

  private async startSession(user: User): Promise<void> {
    const token = await this.createToken(user);
    this.accessToken.set(token);
    this.currentUserIdState.set(user.id);
  }

  private applySession(res: SessionResponse): void {
    const u: SessionUser = res.user;
    this.accessToken.set(res.accessToken);
    this.httpUser.set({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      avatarUrl: 'assets/avatars/default.png',
      preferences: {
        language: u.language ?? 'en',
        notificationsEnabled: u.notificationsEnabled !== false,
        theme: u.theme ?? 'light',
      },
      passwordHash: '',
      salt: '',
      totpSecret: '',
      totpEnabled: u.totpEnabled,
    });
    this.currentUserIdState.set(u.id);
  }

  private clearSession(): void {
    this.accessToken.set(null);
    this.httpUser.set(null);
    this.currentUserIdState.set(null);
  }

  private async createToken(user: User): Promise<string> {
    const header = this.base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = this.base64UrlEncode(
      JSON.stringify({
        sub: user.id,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
      }),
    );
    const signature = this.base64UrlEncode(
      await this.hmacSha256(JWT_SECRET, `${header}.${payload}`),
    );
    return `${header}.${payload}.${signature}`;
  }

  private async verifyToken(token: string): Promise<string | null> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [header, payload, signature] = parts;
    const expected = this.base64UrlEncode(
      await this.hmacSha256(JWT_SECRET, `${header}.${payload}`),
    );
    if (expected !== signature) {
      return null;
    }

    let data: { sub?: string; exp?: number };
    try {
      data = JSON.parse(this.base64UrlDecode(payload));
    } catch {
      return null;
    }

    if (!data.sub || !data.exp || data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return data.sub;
  }

  private async sha256Hex(value: string): Promise<string> {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private async hmacSha256(secret: string, data: string): Promise<ArrayBuffer> {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  }

  private async hmacSha1(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes as BufferSource,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign'],
    );
    return new Uint8Array(await crypto.subtle.sign('HMAC', key, data as BufferSource));
  }

  private async totpCode(secret: string, counter: number): Promise<string> {
    const keyBytes = this.base32Decode(secret);
    const counterBytes = new Uint8Array(8);
    let c = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = c & 0xff;
      c >>= 8;
    }

    const sig = await this.hmacSha1(keyBytes, counterBytes);
    const offset = sig[sig.length - 1] & 0x0f;
    const binary =
      ((sig[offset] & 0x7f) << 24) |
      ((sig[offset + 1] & 0xff) << 16) |
      ((sig[offset + 2] & 0xff) << 8) |
      (sig[offset + 3] & 0xff);
    const code = binary % 10 ** TOTP_DIGITS;
    return code.toString().padStart(TOTP_DIGITS, '0');
  }

  private async verifyTotp(secret: string, code: string): Promise<boolean> {
    const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
    const normalized = code.replace(/\s+/g, '');
    for (let window = -1; window <= 1; window++) {
      if (await this.totpCode(secret, counter + window) === normalized) {
        return true;
      }
    }
    return false;
  }

  private generateSalt(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateTotpSecret(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    let bits = '';
    for (const byte of bytes) {
      bits += byte.toString(2).padStart(8, '0');
    }
    let out = '';
    for (let i = 0; i + 5 <= bits.length; i += 5) {
      out += TOTP_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
    }
    return out;
  }

  private base32Decode(value: string): Uint8Array {
    const cleaned = value.toUpperCase().replace(/=+$/, '');
    let bits = '';
    for (const char of cleaned) {
      const idx = TOTP_ALPHABET.indexOf(char);
      if (idx < 0) {
        continue;
      }
      bits += idx.toString(2).padStart(5, '0');
    }
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
    }
    return bytes;
  }

  private base64UrlEncode(input: string | ArrayBuffer): string {
    const bytes =
      typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private base64UrlDecode(value: string): string {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    return atob(padded + padding);
  }
}
