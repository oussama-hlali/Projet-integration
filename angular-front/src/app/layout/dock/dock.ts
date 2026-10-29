import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ACCOUNT_NAV, NavItem } from '../../core/navigation';
import { AuthService } from '../../core/services/auth.service';
import { NavIconComponent, ThemeToggleComponent } from '../../shared/components';

/**
 * Floating shortcut rail: account destinations, theme switch and sign-out.
 *
 * Fixed to the left on desktop and re-flowed into a bottom bar on phones.
 */
@Component({
  selector: 'app-dock',
  imports: [RouterLink, RouterLinkActive, NavIconComponent, ThemeToggleComponent],
  templateUrl: './dock.html',
  styleUrl: './dock.scss',
})
export class Dock {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly visibleAccount = computed<readonly NavItem[]>(() =>
    ACCOUNT_NAV.filter((item) => !item.adminOnly || this.auth.isAdmin()),
  );

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
