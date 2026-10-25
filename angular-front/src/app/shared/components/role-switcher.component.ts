import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

interface RoleOption {
  readonly value: UserRole;
  readonly label: string;
}

/**
 * PB-05 — Demo role switcher.
 *
 * Lets a signed-in visitor flip between the student and administrator views
 * without signing out. Demo only: it just updates the in-memory/localStorage
 * role, no token or security boundary is involved.
 */
@Component({
  selector: 'app-role-switcher',
  standalone: true,
  template: `
    <div class="switcher" role="group" aria-label="Demo role">
      @for (option of options; track option.value) {
        <button
          class="switcher__option"
          type="button"
          [class.switcher__option--active]="isActive(option.value)"
          [attr.aria-pressed]="isActive(option.value)"
          (click)="select(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .switcher {
        display: inline-flex;
        gap: 2px;
        padding: 3px;
        background: var(--color-surface-muted);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
      }

      .switcher__option {
        padding: 0.3rem 0.7rem;
        font: inherit;
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        line-height: 1.4;
        color: var(--color-text-muted);
        background: transparent;
        border: 0;
        border-radius: var(--radius-full);
        cursor: pointer;
        transition:
          color var(--transition-fast),
          background var(--transition-fast),
          box-shadow var(--transition-fast);
      }

      .switcher__option:hover {
        color: var(--color-text-strong);
      }

      .switcher__option--active {
        color: var(--color-accent);
        background: var(--color-surface);
        box-shadow: var(--shadow-xs);
      }

      .switcher__option:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
    `,
  ],
})
export class RoleSwitcherComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly options: readonly RoleOption[] = [
    { value: 'student', label: 'Student' },
    { value: 'administrator', label: 'Admin' },
  ];

  protected isActive(role: UserRole): boolean {
    return this.auth.currentRole() === role;
  }

  protected select(role: UserRole): void {
    if (this.auth.currentRole() === role) {
      return;
    }

    this.auth.login(role);

    // Guards only run on navigation, so leaving the admin area must be explicit.
    const path = this.router.url.split('?')[0];
    if (role !== 'administrator' && path.startsWith('/admin')) {
      void this.router.navigateByUrl('/dashboard');
    }
  }
}
