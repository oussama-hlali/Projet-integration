import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  Preferences,
  UpdatePreferencesInput,
  UpdateProfileInput,
  User,
  UserRole,
} from '../models/user.model';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'smart-campus.users';

/**
 * User directory and the signed-in demo profile.
 *
 * The active profile follows the demo role chosen on the sign-in page, which
 * keeps `/profile` and `/admin/users` consistent with the shell's role
 * switcher. Profile and preference edits are persisted locally.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly auth = inject(AuthService);
  private readonly state = signal<User[]>(this.load());

  readonly users = this.state.asReadonly();

  /** Profile of the signed-in demo user (student by default). */
  readonly currentUser = computed<User>(() => {
    const role: UserRole = this.auth.isAdmin() ? 'ADMINISTRATOR' : 'STUDENT';
    return this.state().find((user) => user.role === role) ?? this.state()[0];
  });

  getUsers(): Observable<User[]> {
    return of(this.state());
  }

  getUserById(id: string): Observable<User | undefined> {
    return of(this.state().find((user) => user.id === id));
  }

  findById(id: string): User | undefined {
    return this.state().find((user) => user.id === id);
  }

  updateProfile(id: string, input: UpdateProfileInput): User | undefined {
    return this.patch(id, input);
  }

  updatePreferences(id: string, preferences: UpdatePreferencesInput): User | undefined {
    return this.patch(id, { preferences: { ...preferences } });
  }

  updateRole(id: string, role: UserRole): User | undefined {
    return this.patch(id, { role });
  }

  add(input: Omit<User, 'id'>): User {
    const user: User = {
      ...input,
      id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      preferences: { ...input.preferences },
    };

    this.commit([...this.state(), user]);
    return user;
  }

  remove(id: string): boolean {
    if (!this.findById(id) || this.state().length <= 1) {
      return false;
    }

    this.commit(this.state().filter((user) => user.id !== id));
    return true;
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
    this.persist(users);
  }

  private load(): User[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) {
            return parsed as User[];
          }
        }
      } catch {
        // Fall through to the seeded directory.
      }
    }

    return this.seed();
  }

  private persist(users: User[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Storage can be full or blocked; the in-memory directory still works.
    }
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
      },
      {
        id: 'u2',
        fullName: 'Oussama Hlali',
        email: 'oussama.hlali@campus.tn',
        role: 'STUDENT',
        avatarUrl: 'assets/avatars/u2.png',
        preferences: { language: 'fr', notificationsEnabled: false, theme: 'light' },
      },
      {
        id: 'u3',
        fullName: 'Sami Ben Ali',
        email: 'sami.benali@campus.tn',
        role: 'ADMINISTRATOR',
        avatarUrl: 'assets/avatars/u3.png',
        preferences: { language: 'fr', notificationsEnabled: true, theme: 'light' },
      },
    ];
  }
}

/** Re-exported for forms that only need the preferences shape. */
export type { Preferences };
