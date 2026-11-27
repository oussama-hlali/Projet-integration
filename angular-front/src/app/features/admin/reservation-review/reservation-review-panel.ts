import { DatePipe } from '@angular/common';
import { Component, HostListener, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Reservation } from '../../../core/models/reservation.model';
import { ReservationService } from '../../../core/services/reservation.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavIconComponent } from '../../../shared/components';

/**
 * Bottom Review flyout opened from the left dock (bottom bar on phones).
 *
 * The choreography mirrors the Faivra-style IA launcher — fixed flyout,
 * triangle and fade-in — but every decision calls the live campus endpoints
 * through `ReservationService`, so Supabase and student notifications stay in
 * sync with the full `/admin/review` page.
 */
@Component({
  selector: 'app-reservation-review-panel',
  imports: [DatePipe, RouterLink, NavIconComponent],
  templateUrl: './reservation-review-panel.html',
  styleUrl: './reservation-review-panel.scss',
})
export class ReservationReviewPanel {
  readonly open = input(false);
  readonly closed = output<void>();

  private readonly reservations = inject(ReservationService);
  private readonly toast = inject(ToastService);

  protected readonly pending = this.reservations.pending;
  protected readonly feedback = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected close(): void {
    this.closed.emit();
  }

  protected accept(reservation: Reservation): void {
    this.clearMessages();
    const updated = this.reservations.approve(reservation.id);
    if (!updated) {
      this.error.set('That request is no longer pending.');
      this.toast.error('Review failed', 'The request was already decided elsewhere.');
      return;
    }
    const message = `${updated.room} was accepted for ${this.when(updated)}.`;
    this.feedback.set(message);
    this.toast.success('Reservation accepted', message);
  }

  protected deny(reservation: Reservation): void {
    this.clearMessages();
    const updated = this.reservations.deny(reservation.id);
    if (!updated) {
      this.error.set('That request is no longer pending.');
      this.toast.error('Review failed', 'The request was already decided elsewhere.');
      return;
    }
    const message = `${updated.room} for ${this.when(updated)} was declined.`;
    this.feedback.set(message);
    this.toast.info('Reservation declined', message);
  }

  /** Fast review while the flyout is open: A accepts, D declines the oldest request. */
  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.open() || event.defaultPrevented) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.matches('input, textarea, select, [contenteditable="true"]')) {
      return;
    }

    const next = this.pending()[0];
    if (!next) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === 'a') {
      event.preventDefault();
      this.accept(next);
    } else if (key === 'd') {
      event.preventDefault();
      this.deny(next);
    }
  }

  protected when(reservation: Reservation): string {
    const start = reservation.startTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const end = reservation.endTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${reservation.startTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${start}–${end}`;
  }

  protected dismissFeedback(): void {
    this.feedback.set(null);
  }

  protected dismissError(): void {
    this.error.set(null);
  }

  private clearMessages(): void {
    this.feedback.set(null);
    this.error.set(null);
  }
}
