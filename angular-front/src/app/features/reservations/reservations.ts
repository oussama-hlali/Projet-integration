import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  CreateReservationInput,
  RESERVATION_ROOMS,
  Reservation,
  ReservationPhase,
  ReservationStatusFilter,
} from '../../core/models/reservation.model';
import { ReservationService } from '../../core/services/reservation.service';
import {
  BadgeVariant,
  ConfirmDialogComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  StatCardComponent,
  StatusBadgeComponent,
} from '../../shared/components';

interface StatusOption {
  value: ReservationStatusFilter;
  label: string;
}

/** Rejects a date input earlier than the day the page was opened. */
function dateNotInPast(minDate: string) {
  return (control: AbstractControl): ValidationErrors | null =>
    !control.value || control.value >= minDate ? null : { dateInPast: true };
}

const PHASE_LABELS: Record<ReservationPhase, string> = {
  upcoming: 'Upcoming',
  past: 'Past',
  cancelled: 'Cancelled',
};

const PHASE_VARIANTS: Record<ReservationPhase, BadgeVariant> = {
  upcoming: 'success',
  past: 'neutral',
  cancelled: 'danger',
};

const PHASE_ORDER: Record<ReservationPhase, number> = {
  upcoming: 0,
  past: 1,
  cancelled: 2,
};

/**
 * PB-09 — Reservations.
 *
 * Students list their bookings, narrow them with status / room / text filters
 * and cancel one after confirming in a dialog. Creation stays available from
 * the side panel (SCRUM-16) and now refuses overlapping slots.
 */
@Component({
  selector: 'app-reservations',
  imports: [
    ReactiveFormsModule,
    ConfirmDialogComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss',
})
export class Reservations {
  private readonly reservationService = inject(ReservationService);
  private readonly formBuilder = inject(FormBuilder);

  readonly rooms = RESERVATION_ROOMS;
  readonly statusOptions: readonly StatusOption[] = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  readonly reservations = this.reservationService.reservations;
  readonly counts = this.reservationService.counts;

  readonly statusFilter = signal<ReservationStatusFilter>('all');
  readonly roomFilter = signal<string>('all');
  readonly search = signal('');

  readonly today = this.toDateInputValue(new Date());
  readonly submitted = signal(false);
  readonly formError = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);

  readonly cancelTarget = signal<Reservation | null>(null);
  readonly dialogOpen = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    room: ['', Validators.required],
    date: ['', [Validators.required, dateNotInPast(this.today)]],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    purpose: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(120)]],
  });

  readonly metrics = computed(() => {
    const counts = this.counts();
    return [
      { label: 'Upcoming', value: counts.upcoming, hint: 'Confirmed bookings' },
      { label: 'Past', value: counts.past, hint: 'Already attended' },
      { label: 'Cancelled', value: counts.cancelled, hint: 'Cancelled by you' },
    ];
  });

  readonly filterRooms = computed(() =>
    Array.from(new Set(this.reservations().map((reservation) => reservation.room))).sort((a, b) =>
      a.localeCompare(b),
    ),
  );

  readonly filtered = computed(() => {
    const status = this.statusFilter();
    const room = this.roomFilter();
    const term = this.search().trim().toLowerCase();

    const rows = this.reservations().filter((reservation) => {
      if (status !== 'all' && this.phaseOf(reservation) !== status) {
        return false;
      }

      if (room !== 'all' && reservation.room !== room) {
        return false;
      }

      return (
        !term ||
        `${reservation.room} ${reservation.purpose} ${reservation.date}`
          .toLowerCase()
          .includes(term)
      );
    });

    return rows.sort((a, b) => {
      const phaseA = this.phaseOf(a);
      const phaseB = this.phaseOf(b);
      const byPhase = PHASE_ORDER[phaseA] - PHASE_ORDER[phaseB];

      if (byPhase !== 0) {
        return byPhase;
      }

      return phaseA === 'upcoming'
        ? this.startsAt(a) - this.startsAt(b)
        : this.startsAt(b) - this.startsAt(a);
    });
  });

  readonly hasFilters = computed(
    () => this.statusFilter() !== 'all' || this.roomFilter() !== 'all' || !!this.search().trim(),
  );

  readonly dialogMessage = computed(() => {
    const target = this.cancelTarget();
    return target
      ? `Cancel your booking for ${target.room} on ${this.formatDateMoment(target.date)} from ${
          target.startTime
        } to ${target.endTime}? The booking stays in your history.`
      : '';
  });

  // ── Form ──────────────────────────────────────────────────

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  hasValidTimeRange(): boolean {
    const { startTime, endTime } = this.form.getRawValue();
    return !startTime || !endTime || startTime < endTime;
  }

  submitReservation(): void {
    this.submitted.set(true);
    this.feedback.set(null);
    this.formError.set(null);

    if (!this.hasValidTimeRange()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const input: CreateReservationInput = {
      room: value.room,
      date: value.date,
      startTime: value.startTime,
      endTime: value.endTime,
      purpose: value.purpose.trim(),
    };

    const result = this.reservationService.create(input);

    if (!result.ok) {
      this.formError.set(
        result.reason === 'conflict'
          ? `${input.room} is already booked for that slot. Pick another room or time.`
          : 'End time must be after start time.',
      );
      return;
    }

    this.form.reset();
    this.submitted.set(false);
    this.clearFilters();
    this.feedback.set(
      `Reservation confirmed for ${result.reservation.room} on ${this.formatDateMoment(
        result.reservation.date,
      )}.`,
    );
  }

  resetForm(): void {
    this.form.reset();
    this.submitted.set(false);
    this.formError.set(null);
  }

  // ── Filters ───────────────────────────────────────────────

  setStatus(status: ReservationStatusFilter): void {
    this.statusFilter.set(status);
  }

  setRoom(event: Event): void {
    this.roomFilter.set((event.target as HTMLSelectElement).value);
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  clearFilters(): void {
    this.statusFilter.set('all');
    this.roomFilter.set('all');
    this.search.set('');
  }

  // ── Cancellation ──────────────────────────────────────────

  requestCancel(reservation: Reservation): void {
    this.cancelTarget.set(reservation);
    this.dialogOpen.set(true);
  }

  dismissCancel(): void {
    this.dialogOpen.set(false);
    this.cancelTarget.set(null);
  }

  confirmCancel(): void {
    const target = this.cancelTarget();
    this.cancelTarget.set(null);

    if (!target) {
      return;
    }

    const cancelled = this.reservationService.cancel(target.id);
    if (cancelled) {
      this.feedback.set(
        `Reservation for ${cancelled.room} on ${this.formatDateMoment(
          cancelled.date,
        )} was cancelled.`,
      );
    }
  }

  dismissFeedback(): void {
    this.feedback.set(null);
  }

  // ── View helpers ──────────────────────────────────────────

  phaseOf(reservation: Reservation): ReservationPhase {
    return this.reservationService.phaseOf(reservation);
  }

  phaseLabel(reservation: Reservation): string {
    return PHASE_LABELS[this.phaseOf(reservation)];
  }

  phaseVariant(reservation: Reservation): BadgeVariant {
    return PHASE_VARIANTS[this.phaseOf(reservation)];
  }

  canCancel(reservation: Reservation): boolean {
    return reservation.state === 'confirmed' && this.phaseOf(reservation) === 'upcoming';
  }

  monthOf(isoDate: string): string {
    return this.parseDate(isoDate).toLocaleDateString('en-GB', { month: 'short' });
  }

  dayOf(isoDate: string): string {
    return String(this.parseDate(isoDate).getDate());
  }

  weekdayOf(isoDate: string): string {
    return this.parseDate(isoDate).toLocaleDateString('en-GB', { weekday: 'short' });
  }

  longDate(isoDate: string): string {
    return this.parseDate(isoDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  private formatDateMoment(isoDate: string): string {
    return this.parseDate(isoDate).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  private startsAt(reservation: Reservation): number {
    return this.parseDate(reservation.date).getTime() + this.toMinutes(reservation.startTime);
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /** Parses `YYYY-MM-DD` as a local date (DatePipe would treat it as UTC). */
  private parseDate(isoDate: string): Date {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toDateInputValue(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
