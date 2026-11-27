import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ACCOUNT_NAV, NavItem } from '../../core/navigation';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { ReservationReviewPanel } from '../../features/admin/reservation-review/reservation-review-panel';
import { BrandMarkComponent, NavIconComponent, ThemeToggleComponent } from '../../shared/components';

/**
 * Floating shortcut rail: account destinations, theme switch and sign-out.
 *
 * Fixed to the left on desktop and re-flowed into a bottom bar on phones.
 */
@Component({
  selector: 'app-dock',
  imports: [
    RouterLink,
    RouterLinkActive,
    BrandMarkComponent,
    NavIconComponent,
    ThemeToggleComponent,
    ReservationReviewPanel,
  ],
  templateUrl: './dock.html',
  styleUrl: './dock.scss',
})
export class Dock {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly reservations = inject(ReservationService);

  protected readonly homeRoute = this.auth.homeRoute;
  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly reviewRoute = '/admin/review';
  protected readonly pendingReviews = computed(() => this.reservations.pending().length);
  protected readonly reviewOpen = signal(false);

  protected readonly visibleAccount = computed<readonly NavItem[]>(() =>
    ACCOUNT_NAV.filter((item) => !item.adminOnly || this.auth.isAdmin()),
  );

  protected toggleReview(): void {
    this.reviewOpen.update((value) => !value);
  }

  protected closeReview(): void {
    this.reviewOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
