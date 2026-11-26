import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../config/runtime-config.service';
import {
  CreateReservationInput,
  CreateReservationResult,
  Reservation,
  ReservationCounts,
  ReservationPhase,
  ReservationStatus,
} from '../models/reservation.model';
import { mapReservation } from './live-mappers';
import { NotificationService } from './notification.service';
import { RoomService } from './room.service';

const DEMO_USER_ID = 'u1';

/**
 * PB-09 — Reservation store.
 *
 * Production reads and writes the campus service through the gateway. Mock
 * mode keeps deterministic demo bookings; the shape follows the class diagram
 * (`startTime` and `endTime` are dates, `status` is one of four enum values).
 */
@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly rooms = inject(RoomService);
  private readonly notifications = inject(NotificationService);
  private readonly http = inject(HttpClient, { optional: true });
  private readonly cfg = inject(RuntimeConfigService, { optional: true });
  private readonly state = signal<Reservation[]>(environment.useMocks ? this.load() : []);

  constructor() {
    if (environment.useMocks) {
      this.syncCompleted();
    } else {
      this.refresh();
    }
  }

  private apiBase(): string {
    return this.cfg!.apiBaseUrl();
  }

  private refresh(): void {
    this.http!.get<any[]>(`${this.apiBase()}/reservations`).subscribe({
      next: (rows) => this.commit(rows.map(mapReservation)),
      error: () => {},
    });
  }

  /** All bookings; the page sorts them for display. */
  readonly reservations = this.state.asReadonly();

  /** Totals for the stats strip and the filter chips. */
  readonly counts = computed<ReservationCounts>(() => {
    const now = new Date();
    const counts: ReservationCounts = { all: 0, upcoming: 0, past: 0, cancelled: 0 };

    for (const reservation of this.state()) {
      counts.all += 1;
      counts[this.phaseOf(reservation, now)] += 1;
    }

    return counts;
  });

  /** Pending requests waiting for an administrator decision, soonest first. */
  readonly pending = computed<readonly Reservation[]>(() =>
    this.state()
      .filter((reservation) => reservation.status === 'PENDING')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
  );

  /** Upcoming = still ahead of its end time; cancelled always wins. */
  phaseOf(reservation: Reservation, now: Date = new Date()): ReservationPhase {
    if (reservation.status === 'CANCELLED') {
      return 'cancelled';
    }

    if (reservation.status === 'COMPLETED' || reservation.endTime <= now) {
      return 'past';
    }

    return 'upcoming';
  }

  /** True when the slot collides with another active booking of that room. */
  hasConflict(input: CreateReservationInput): boolean {
    return this.state().some(
      (reservation) =>
        (reservation.status === 'CONFIRMED' || reservation.status === 'PENDING') &&
        reservation.roomId === input.roomId &&
        input.startTime < reservation.endTime &&
        input.endTime > reservation.startTime,
    );
  }

  create(input: CreateReservationInput): CreateReservationResult {
    if (input.startTime >= input.endTime) {
      return { ok: false, reason: 'invalid-range' };
    }

    const room = this.rooms.findById(input.roomId);
    if (room?.status === 'MAINTENANCE') {
      return { ok: false, reason: 'unavailable' };
    }

    if (this.hasConflict(input)) {
      return { ok: false, reason: 'conflict' };
    }

    const reservation: Reservation = {
      id: this.newId(),
      roomId: input.roomId,
      room: input.room || room?.name || 'Room',
      startTime: input.startTime,
      endTime: input.endTime,
      purpose: input.purpose.trim(),
      // The campus service creates PENDING bookings; an admin confirms them.
      status: environment.useMocks ? 'CONFIRMED' : 'PENDING',
      userId: input.userId ?? DEMO_USER_ID,
    };

    this.commit([...this.state(), reservation]);
    const notify = (saved: Reservation): void => {
      this.notifications.add({
        message: `Votre réservation pour ${saved.room} est confirmée.`,
        type: 'RESERVATION',
        reservationId: saved.id,
      });
    };

    if (!environment.useMocks) {
      this.http!.post<any>(`${this.apiBase()}/reservations`, {
        roomId: input.roomId,
        userId: reservation.userId,
        startTime: input.startTime.toISOString(),
        endTime: input.endTime.toISOString(),
        purpose: reservation.purpose,
      }).subscribe({
        next: (row) => {
          const saved = mapReservation(row);
          this.replace(reservation.id, saved);
          notify(saved);
        },
        error: () => {
          this.commit(this.state().filter((candidate) => candidate.id !== reservation.id));
          this.refresh();
        },
      });
    } else {
      notify(reservation);
    }
    return { ok: true, reservation };
  }

  /** `cancel()` in the diagram: the row stays in the list for history. */
  cancel(id: string): Reservation | undefined {
    const target = this.state().find((reservation) => reservation.id === id);
    if (!target || target.status === 'CANCELLED') {
      return undefined;
    }

    return this.transition(id, 'CANCELLED', (saved) => {
      this.notifications.add({
        message: `Votre réservation pour ${saved.room} a été annulée.`,
        type: 'RESERVATION',
        reservationId: saved.id,
      });
    });
  }

  /** Approve a pending booking. */
  approve(id: string): Reservation | undefined {
    const target = this.state().find((reservation) => reservation.id === id);
    if (!target || target.status !== 'PENDING') {
      return undefined;
    }

    return this.transition(id, 'CONFIRMED', (saved) => {
      this.notifications.add({
        message: `Votre réservation pour ${saved.room} est confirmée.`,
        type: 'RESERVATION',
        reservationId: saved.id,
      });
    });
  }

  /** Decline a pending request. The row stays as CANCELLED for history. */
  deny(id: string): Reservation | undefined {
    const target = this.state().find((reservation) => reservation.id === id);
    if (!target || target.status !== 'PENDING') {
      return undefined;
    }

    return this.transition(id, 'CANCELLED', (saved) => {
      this.notifications.add({
        message: `Votre demande de réservation pour ${saved.room} a été refusée.`,
        type: 'RESERVATION',
        reservationId: saved.id,
      });
    });
  }

  /** Mark a booking as completed once its slot is over. */
  complete(id: string): Reservation | undefined {
    const target = this.state().find((reservation) => reservation.id === id);
    if (!target || target.status === 'CANCELLED' || target.status === 'COMPLETED') {
      return undefined;
    }

    return this.transition(id, 'COMPLETED');
  }

  /** Refresh statuses so past confirmed bookings become completed. */
  syncCompleted(): void {
    if (!environment.useMocks) {
      // The campus service has the authoritative auto-complete scheduler.
      this.refresh();
      return;
    }

    const now = new Date();
    let changed = false;
    const next = this.state().map((reservation) => {
      if (reservation.status === 'CONFIRMED' && reservation.endTime <= now) {
        changed = true;
        return { ...reservation, status: 'COMPLETED' as ReservationStatus };
      }
      return reservation;
    });

    if (changed) {
      this.commit(next);
    }
  }

  /** Administrator transitions used by the management screens. */
  setStatus(id: string, status: ReservationStatus): Reservation | undefined {
    return this.transition(id, status);
  }

  /**
   * Apply a transition optimistically, reconcile with the backend row, and
   * roll back if the campus service rejects it.
   */
  private transition(
    id: string,
    status: ReservationStatus,
    onSaved?: (reservation: Reservation) => void,
  ): Reservation | undefined {
    const target = this.state().find((reservation) => reservation.id === id);
    if (!target) {
      return undefined;
    }

    const updated: Reservation = { ...target, status };
    this.replace(id, updated);

    const endpoint =
      status === 'CANCELLED'
        ? 'cancel'
        : status === 'CONFIRMED'
          ? 'confirm'
          : status === 'COMPLETED'
            ? 'complete'
            : null;

    if (environment.useMocks || !endpoint) {
      onSaved?.(updated);
      return updated;
    }

    this.http!.post<any>(`${this.apiBase()}/reservations/${id}/${endpoint}`, {}).subscribe({
      next: (row) => {
        const saved = mapReservation(row);
        this.replace(id, saved);
        onSaved?.(saved);
      },
      error: () => {
        this.replace(id, target);
        this.refresh();
      },
    });
    return updated;
  }

  private newId(): string {
    return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  private replace(id: string, reservation: Reservation): void {
    this.commit(
      this.state().map((candidate) => (candidate.id === id ? reservation : candidate)),
    );
  }

  private commit(reservations: Reservation[]): void {
    this.state.set(reservations);
  }

  /**
   * Returns persisted bookings, or `null` when nothing was ever stored —
   * `[]` is valid and must not resurrect the demo data.
   */
  private load(): Reservation[] {
    return this.seed();
  }

  /** Accepts both the current shape and the earlier date/time-string shape. */
  private normalize(entry: unknown): Reservation | null {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const value = entry as Record<string, unknown>;
    const { id, room, roomId, purpose } = value;

    if (
      (typeof id !== 'string' && typeof id !== 'number') ||
      typeof room !== 'string' ||
      typeof purpose !== 'string'
    ) {
      return null;
    }

    const range = this.parseRange(value);
    if (!range) {
      return null;
    }

    return {
      id: String(id),
      roomId: typeof roomId === 'string' ? roomId : this.findRoomId(room),
      room,
      startTime: range.start,
      endTime: range.end,
      purpose,
      status: this.normalizeStatus(value['status'], value['state']),
      userId: typeof value['userId'] === 'string' ? value['userId'] : DEMO_USER_ID,
    };
  }

  private parseRange(value: Record<string, unknown>): { start: Date; end: Date } | null {
    const start = value['startTime'];
    const end = value['endTime'];

    if (typeof start !== 'string' || typeof end !== 'string') {
      return null;
    }

    // Current shape: ISO date-time strings.
    const directStart = new Date(start);
    const directEnd = new Date(end);
    if (!Number.isNaN(directStart.getTime()) && !Number.isNaN(directEnd.getTime())) {
      return { start: directStart, end: directEnd };
    }

    // Legacy shape: `date` plus two `HH:mm` strings.
    const legacyDate = value['date'];
    if (typeof legacyDate === 'string') {
      const legacyStart = new Date(`${legacyDate}T${start}:00`);
      const legacyEnd = new Date(`${legacyDate}T${end}:00`);
      if (!Number.isNaN(legacyStart.getTime()) && !Number.isNaN(legacyEnd.getTime())) {
        return { start: legacyStart, end: legacyEnd };
      }
    }

    return null;
  }

  private normalizeStatus(status: unknown, legacyState: unknown): ReservationStatus {
    if (
      status === 'PENDING' ||
      status === 'CONFIRMED' ||
      status === 'CANCELLED' ||
      status === 'COMPLETED'
    ) {
      return status;
    }

    return legacyState === 'cancelled' ? 'CANCELLED' : 'CONFIRMED';
  }

  private findRoomId(roomName: string): string {
    return this.rooms.rooms().find((room) => room.name === roomName)?.id ?? roomName;
  }

  private seed(): Reservation[] {
    const at = (offsetDays: number, time: string): Date => {
      const date = new Date();
      date.setDate(date.getDate() + offsetDays);
      const [hours, minutes] = time.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    return [
      {
        id: 'seed-1',
        roomId: 'room-11',
        room: 'Innovation Lab',
        startTime: at(2, '10:00'),
        endTime: at(2, '12:00'),
        purpose: 'Design review with the project team',
        status: 'CONFIRMED',
        userId: DEMO_USER_ID,
      },
      {
        id: 'seed-2',
        roomId: 'room-12',
        room: 'Study Room A',
        startTime: at(5, '14:00'),
        endTime: at(5, '15:30'),
        purpose: 'Revision session for the SOA exam',
        status: 'CONFIRMED',
        userId: DEMO_USER_ID,
      },
      {
        id: 'seed-3',
        roomId: 'room-14',
        room: 'Conference Room',
        startTime: at(-6, '09:00'),
        endTime: at(-6, '10:30'),
        purpose: 'Sprint review with the client',
        status: 'COMPLETED',
        userId: DEMO_USER_ID,
      },
      {
        id: 'seed-4',
        roomId: 'room-13',
        room: 'Study Room B',
        startTime: at(-11, '16:00'),
        endTime: at(-11, '18:00'),
        purpose: 'Robotics club meetup',
        status: 'CANCELLED',
        userId: DEMO_USER_ID,
      },
      {
        id: 'seed-5',
        roomId: 'room-5',
        room: 'Salle de réunion 1',
        startTime: at(8, '11:00'),
        endTime: at(8, '12:00'),
        purpose: 'Student council meeting',
        status: 'PENDING',
        userId: DEMO_USER_ID,
      },
    ];
  }
}
