import { DatePipe } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';

import { Reservation } from '../../../core/models/reservation.model';
import { ReservationService } from '../../../core/services/reservation.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  EmptyStateComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
} from '../../../shared/components';

/**
 * Focused approval queue for room reservations.
 *
 * The bottom dock's Review shortcut lands here: every pending request is
 * decided with Accept or Deny. Both actions use the live campus endpoints via
 * `ReservationService`, so Supabase is updated and the student is notified.
 */
@Component({
  selector: 'app-reservation-review',
  imports: [DatePipe, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './reservation-review.html',
  styleUrl: './reservation-review.scss',
})
export class ReservationReview {
  private readonly reservations = inject(ReservationService);
  private readonly toast = inject(ToastService);

  protected readonly pending = this.reservations.pending;
  protected readonly feedback = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

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
    const message = `${updated.room} for ${this.when(updated)} was denied.`;
    this.feedback.set(message);
    this.toast.info('Reservation denied', message);
  }

  /** Faivra-style fast review: A accepts, D denies the oldest pending request. */
  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
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
    const date = reservation.startTime.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
    const start = reservation.startTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const end = reservation.endTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${date}, ${start}–${end}`;
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
