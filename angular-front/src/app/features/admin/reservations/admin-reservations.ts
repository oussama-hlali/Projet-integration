import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import {
  RESERVATION_STATUSES,
  RESERVATION_STATUS_LABELS,
  Reservation,
  ReservationStatus,
} from '../../../core/models/reservation.model';
import { AdminService } from '../../../core/services/admin.service';
import { ReservationService } from '../../../core/services/reservation.service';
import {
  BadgeVariant,
  EmptyStateComponent,
  PageHeaderComponent,
  StatCardComponent,
  StatusBadgeComponent,
} from '../../../shared/components';

type StatusFilter = 'all' | ReservationStatus;

const STATUS_VARIANTS: Record<ReservationStatus, BadgeVariant> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'neutral',
};

const STATUS_ORDER: Record<ReservationStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

/**
 * Administrator reservation desk.
 *
 * Approves pending requests, completes finished bookings and cancels the ones
 * that cannot go ahead. Every transition goes through `AdminService`, which
 * also feeds the notification store.
 */
@Component({
  selector: 'app-admin-reservations',
  imports: [
    DatePipe,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './admin-reservations.html',
  styleUrl: './admin-reservations.scss',
})
export class AdminReservations {
  private readonly admin = inject(AdminService);
  private readonly reservationService = inject(ReservationService);

  protected readonly reservations = this.reservationService.reservations;
  protected readonly statuses = RESERVATION_STATUSES;
  protected readonly statusLabels = RESERVATION_STATUS_LABELS;

  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly search = signal('');
  protected readonly feedback = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly metrics = computed(() => {
    const reservations = this.reservations();
    return [
      {
        label: 'Pending',
        value: reservations.filter((item) => item.status === 'PENDING').length,
        hint: 'Awaiting approval',
      },
      {
        label: 'Confirmed',
        value: reservations.filter((item) => item.status === 'CONFIRMED').length,
        hint: 'Approved and ahead',
      },
      {
        label: 'Completed',
        value: reservations.filter((item) => item.status === 'COMPLETED').length,
        hint: 'Finished bookings',
      },
      {
        label: 'Cancelled',
        value: reservations.filter((item) => item.status === 'CANCELLED').length,
        hint: 'Declined or cancelled',
      },
    ];
  });

  protected readonly filtered = computed(() => {
    const status = this.statusFilter();
    const term = this.search().trim().toLowerCase();

    return this.reservations()
      .filter(
        (reservation) =>
          (status === 'all' || reservation.status === status) &&
          (!term ||
            `${reservation.room} ${reservation.purpose} ${reservation.userId}`
              .toLowerCase()
              .includes(term)),
      )
      .sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          a.startTime.getTime() - b.startTime.getTime(),
      );
  });

  protected readonly hasFilters = computed(
    () => this.statusFilter() !== 'all' || !!this.search().trim(),
  );

  protected setStatus(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as StatusFilter);
  }

  protected setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected clearFilters(): void {
    this.statusFilter.set('all');
    this.search.set('');
  }

  protected approve(reservation: Reservation): void {
    this.feedback.set(null);
    this.error.set(null);
    const updated = this.admin.approveReservation(reservation.id);
    if (!updated) {
      this.error.set('That booking is no longer pending.');
      return;
    }
    this.feedback.set(`Booking for ${updated.room} was approved.`);
  }

  protected complete(reservation: Reservation): void {
    this.feedback.set(null);
    this.error.set(null);
    const updated = this.admin.completeReservation(reservation.id);
    if (!updated) {
      this.error.set('That booking cannot be completed.');
      return;
    }
    this.feedback.set(`Booking for ${updated.room} was marked as completed.`);
  }

  protected cancel(reservation: Reservation): void {
    this.feedback.set(null);
    this.error.set(null);
    const updated = this.admin.cancelReservation(reservation.id);
    if (!updated) {
      this.error.set('That booking cannot be cancelled.');
      return;
    }
    this.feedback.set(`Booking for ${updated.room} was cancelled.`);
  }

  protected canApprove(reservation: Reservation): boolean {
    return reservation.status === 'PENDING';
  }

  protected canComplete(reservation: Reservation): boolean {
    return reservation.status === 'CONFIRMED';
  }

  protected canCancel(reservation: Reservation): boolean {
    return reservation.status === 'PENDING' || reservation.status === 'CONFIRMED';
  }

  protected statusLabel(status: ReservationStatus): string {
    return RESERVATION_STATUS_LABELS[status];
  }

  protected statusVariant(status: ReservationStatus): BadgeVariant {
    return STATUS_VARIANTS[status];
  }

  protected dismissFeedback(): void {
    this.feedback.set(null);
  }

  protected dismissError(): void {
    this.error.set(null);
  }
}
