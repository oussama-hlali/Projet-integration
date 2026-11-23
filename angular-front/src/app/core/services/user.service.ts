import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Preferences,
  UpdatePreferencesInput,
  UpdateProfileInput,
  User,
  UserRole,
} from '../models/user.model';
import { HttpAuthService } from './http-auth.service';
import { mapUser } from './live-mappers';

/**
 * User directory and the signed-in profile.
 *
 * Live mode reads and writes the identity service through the gateway. Mock
 * mode keeps the deterministic demo directory used by the local UI tests.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly httpAuth = inject(HttpAuthService, { optional: true });
  private readonly state = signal<User[]>(environment.useMocks ? this.seed() : []);

  constructor() {
    if (!environment.useMocks && this.httpAuth) {
      this.httpAuth.listUsers().subscribe({
        next: (rows) => this.state.set(rows.map(mapUser)),
        error: () => {},
      });
    }
  }

  readonly users = this.state.asReadonly();

  getUsers(): Observable<User[]> {
    return of(this.state());
  }

  getUserById(id: string): Observable<User | undefined> {
    return of(this.findById(id));
  }

  findById(id: string): User | undefined {
    return this.state().find((user) => user.id === id);
  }

  findByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    return this.state().find((user) => user.email.toLowerCase() === normalized);
  }

  setTotp(id: string, secret: string, enabled: boolean): User | undefined {
    const target = this.findById(id);
    if (!target) {
      return undefined;
    }

    const updated: User = { ...target, totpSecret: secret, totpEnabled: enabled };
    this.commit(this.state().map((user) => (user.id === id ? updated : user)));
    return updated;
  }

  /** Replace the stored password digest after an administrator reset (mock mode). */
  setCredentials(id: string, passwordHash: string, salt: string): User | undefined {
    return this.patch(id, { passwordHash, salt });
  }

  updateProfile(id: string, input: UpdateProfileInput): User | undefined {
    const target = this.findById(id);
    if (!target) {
      return undefined;
    }

    if (!environment.useMocks && this.httpAuth) {
      // Backend enforces email uniqueness and refuses demoting the last admin.
      this.httpAuth.updateUser(id, { fullName: input.fullName, email: input.email }).subscribe({
        next: (row) => this.replace(id, mapUser(row)),
      });
    }
    return this.patch(id, input);
  }

  updatePreferences(id: string, preferences: UpdatePreferencesInput): User | undefined {
    if (!environment.useMocks && this.httpAuth) {
      this.httpAuth.updatePreferences({ ...preferences }).subscribe({
        next: (row) => this.replace(id, mapUser(row)),
      });
    }
    return this.patch(id, { preferences: { ...preferences } });
  }

  updateRole(id: string, role: UserRole): User | undefined {
    if (!environment.useMocks && this.httpAuth) {
      this.httpAuth.updateUser(id, { role }).subscribe({
        next: (row) => this.replace(id, mapUser(row)),
      });
    }
    return this.patch(id, { role });
  }

  add(input: Omit<User, 'id'>): User {
    const user: User = {
      ...input,
      id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      preferences: { ...input.preferences },
    };

    this.commit([...this.state(), user]);
    if (!environment.useMocks && this.httpAuth) {
      this.httpAuth.createUser({
        fullName: input.fullName,
        email: input.email,
        password: input.passwordHash ?? '',
        role: input.role,
      }).subscribe({
        next: (row) => {
          const saved = mapUser(row);
          this.commit(this.state().map((candidate) => (candidate.id === user.id ? saved : candidate)));
        },
        error: () => this.commit(this.state().filter((candidate) => candidate.id !== user.id)),
      });
    }
    return user;
  }

  remove(id: string): boolean {
    const target = this.findById(id);
    if (!target || this.state().length <= 1) {
      return false;
    }

    this.commit(this.state().filter((user) => user.id !== id));
    if (!environment.useMocks && this.httpAuth) {
      this.httpAuth.deleteUser(id).subscribe({
        error: () => this.commit([...this.state(), target]),
      });
    }
    return true;
  }

  /** Remove a user from the local signal after the backend confirmed deletion. */
  drop(id: string): boolean {
    if (!this.findById(id)) {
      return false;
    }
    this.commit(this.state().filter((user) => user.id !== id));
    return true;
  }

  /** Optimistically cache a backend-created user (admin console). */
  cache(user: User): void {
    this.replace(user.id, user);
  }

  private replace(id: string, user: User): void {
    this.commit(this.state().map((candidate) => (candidate.id === id ? user : candidate)));
  }

  private patch(id: string, changes: Partial<Omit<User, 'id'>>): User | undefined {
    const target = this.findById(id);
    if (!target) {
      return undefined;
    }

    const updated: User = {
      ...target,
      ...changes,
      id,
      preferences: changes.preferences ?? target.preferences,
    };

    this.commit(this.state().map((user) => (user.id === id ? updated : user)));
    return updated;
  }

  private commit(users: User[]): void {
    this.state.set(users);
  }

  private load(): User[] {
    return this.seed();
  }

  private seed(): User[] {
    return [
      {
        id: 'u1',
        fullName: 'Ahmed Wardi',
        email: 'ahmed.wardi@campus.tn',
        role: 'STUDENT',
        avatarUrl: 'assets/avatars/u1.png',
        preferences: { language: 'fr', notificationsEnabled: true, theme: 'dark' },
        passwordHash: 'cb5ba77cc305c0f6e99c41352f5261dca56a76d9135a2d28b571cf85cf823b9e',
        salt: 'cf060c360fe6637876ea9844a2252ab0',
        totpSecret: 'C6BW5GGCYLP5ZDTRVQPKZY2WYRJ2GAV6',
        totpEnabled: false,
      },
      {
        id: 'u2',
        fullName: 'Oussama Hlali',
        email: 'oussama.hlali@campus.tn',
        role: 'STUDENT',
        avatarUrl: 'assets/avatars/u2.png',
        preferences: { language: 'fr', notificationsEnabled: false, theme: 'light' },
        passwordHash: '0552c44c1eae75009478524e66e28cfac4f122051c8d5b79d0ae26243f4982df',
        salt: '4410f0feb080ff75a3bd9f978efbdbee',
        totpSecret: 'XWWBATZPESR7JVGGC2YPSNSUN5ZGPNFU',
        totpEnabled: false,
      },
      {
        id: 'u3',
        fullName: 'Sami Ben Ali',
        email: 'sami.benali@campus.tn',
        role: 'ADMINISTRATOR',
        avatarUrl: 'assets/avatars/u3.png',
        preferences: { language: 'fr', notificationsEnabled: true, theme: 'light' },
        passwordHash: '6548c2caf22d23a5c3b4311a647f6640e13a923fe0afdfedd031afdcb42fbbc3',
        salt: '86b0ce37966b9824d1a1eeddfbcce485',
        totpSecret: 'TTRQ3NPFJL3EDRFEC3YRXYKOQVZ446EM',
        totpEnabled: false,
      },
    ];
  }
}

/** Re-exported for forms that only need the preferences shape. */
export type { Preferences };
