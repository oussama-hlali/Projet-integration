import { Injectable, computed, signal } from '@angular/core';
import { UserRole } from '../models/user.model';

const STORAGE_KEY = 'smart-campus.auth.role';

/**
 * PB-05 — Demo authentication.
 *
 * This is a DEMO ONLY. There is no real authentication, no token, and no
 * security boundary here. It exists so the team can switch between the
 * student and administrator experiences while building Sprint 1.
 *
 * The state is signal-based so any standalone component or template can react
 * to role changes without subscriptions.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly roleState = signal<UserRole | null>(this.readPersistedRole());

  /** Current role, or `null` when signed out. */
  readonly currentRole = this.roleState.asReadonly();

  /** True when a demo role has been selected. */
  readonly isAuthenticated = computed(() => this.roleState() !== null);

  /** Convenience flag for administrator-only surfaces. */
  readonly isAdmin = computed(() => this.roleState() === 'administrator');

  /** Sign in with a demo role. Persists the choice for page reloads. */
  login(role: UserRole): void {
    this.roleState.set(role);
    this.persistRole(role);
  }

  /** Clear the demo session. */
  logout(): void {
    this.roleState.set(null);
    this.persistRole(null);
  }

  private readPersistedRole(): UserRole | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'student' || stored === 'administrator' ? stored : null;
  }

  private persistRole(role: UserRole | null): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    if (role === null) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, role);
  }
}
