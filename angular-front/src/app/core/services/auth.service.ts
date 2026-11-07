import { Injectable, computed, inject, signal } from '@angular/core';
import { User } from '../models/user.model';
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
  private readonly userService = inject(UserService);

  private readonly currentUserIdState = signal<string | null>(null);
  private readonly pendingUserIdState = signal<string | null>(null);

  /** Currently signed-in user, or `null` when signed out. */
  readonly currentUser = computed<User | null>(() => {
    const id = this.currentUserIdState();
    return id ? this.userService.findById(id) ?? null : null;
  });

  /** True when a valid session exists. */
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  /** Convenience flag for administrator-only surfaces. */
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMINISTRATOR');

  /** User awaiting the OTP challenge, if any. */
  readonly pendingUserId = this.pendingUserIdState.asReadonly();

  readonly pendingUser = computed<User | null>(() => {
    const id = this.pendingUserIdState();
    return id ? this.userService.findById(id) ?? null : null;
  });

  /** Load and validate any persisted session. Called before bootstrap. */
  async init(): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(LEGACY_ROLE_KEY);

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      this.currentUserIdState.set(null);
      return;
    }

    const userId = await this.verifyToken(token);
    if (userId && this.userService.findById(userId)) {
      this.currentUserIdState.set(userId);
    } else {
      this.clearSession();
    }
  }

  /** Sign in with email and password. May require OTP/setup afterwards. */
  async login(email: string, password: string): Promise<AuthResult> {
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

  /** Create a student account. OTP setup is required on first sign-in. */
  async register(input: RegisterInput): Promise<AuthResult> {
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

  /** Verify a TOTP code for an already enrolled user. */
  async verifyOtp(code: string): Promise<AuthResult> {
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
    this.pendingUserIdState.set(null);
  }

  /** End the current session. */
  logout(): void {
    this.clearSession();
    this.pendingUserIdState.set(null);
  }

  /** Current TOTP code for a secret (demo helper). */
  async currentTotpCode(secret: string): Promise<string> {
    const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
    return this.totpCode(secret, counter);
  }

  /** Build the otpauth URI scanned by Google Authenticator. */
  otpAuthUri(user: User): string {
    const secret = user.totpSecret ?? '';
    const label = encodeURIComponent(`Smart Campus:${user.email}`);
    const issuer = encodeURIComponent('Smart Campus');
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
  }

  private async startSession(user: User): Promise<void> {
    const token = await this.createToken(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
    this.currentUserIdState.set(user.id);
  }

  private clearSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
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
