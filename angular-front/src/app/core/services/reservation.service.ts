import { Injectable, computed, signal } from '@angular/core';
import {
  CreateReservationInput,
  CreateReservationResult,
  Reservation,
  ReservationCounts,
  ReservationPhase,
  ReservationState,
} from '../models/reservation.model';

const STORAGE_KEY = 'smart-campus-reservations';

/**
 * PB-09 — Reservation store.
 *
 * Demo data lives in `localStorage` so the list survives reloads without a
 * backend. State is signal-based: the page derives its filters and counts
 * from the same source, so cancelling a booking updates everything at once.
 *
 * Legacy records written by the PB-09 form (numeric ids, no `state`) are
 * migrated on read instead of being discarded.
 */
@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly state = signal<Reservation[]>(this.load());

  /** All bookings, newest state first is the page's job to sort. */
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

  /**
   * Upcoming = still ahead of its end time. Cancelled always wins over the
   * clock so a cancelled booking never reappears as "upcoming".
   */
  phaseOf(reservation: Reservation, now: Date = new Date()): ReservationPhase {
    if (reservation.state === 'cancelled') {
      return 'cancelled';
    }

    return this.endsAt(reservation) <= now ? 'past' : 'upcoming';
  }

  /** True when the slot collides with another confirmed booking of that room. */
  hasConflict(input: CreateReservationInput): boolean {
    return this.state().some(
      (reservation) =>
        reservation.state === 'confirmed' &&
        reservation.room === input.room &&
        reservation.date === input.date &&
        input.startTime < reservation.endTime &&
        input.endTime > reservation.startTime,
    );
  }

  create(input: CreateReservationInput): CreateReservationResult {
    if (!input.startTime || !input.endTime || input.startTime >= input.endTime) {
      return { ok: false, reason: 'invalid-range' };
    }

    if (this.hasConflict(input)) {
      return { ok: false, reason: 'conflict' };
    }

    const reservation: Reservation = {
      ...input,
      purpose: input.purpose.trim(),
      id: this.newId(),
      state: 'confirmed',
    };

    this.commit([...this.state(), reservation]);
    return { ok: true, reservation };
  }

  /** Marks a booking as cancelled. The row stays in the list for history. */
  cancel(id: string): Reservation | undefined {
    const target = this.state().find((reservation) => reservation.id === id);
    if (!target || target.state === 'cancelled') {
      return undefined;
    }

    const updated: Reservation = { ...target, state: 'cancelled' };
    this.commit(this.state().map((reservation) => (reservation.id === id ? updated : reservation)));
    return updated;
  }

  private endsAt(reservation: Reservation): Date {
    return this.toDate(reservation.date, reservation.endTime);
  }

  private toDate(date: string, time: string): Date {
    // `YYYY-MM-DDTHH:mm` (no zone suffix) is parsed as local time.
    return new Date(`${date}T${time}:00`);
  }

  private newId(): string {
    return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  private commit(reservations: Reservation[]): void {
    this.state.set(reservations);
    this.persist(reservations);
  }

  /**
   * Returns persisted bookings, or `null` when nothing was ever stored —
   * `[]` is valid and must not resurrect the demo data.
   */
  private load(): Reservation[] {
    const stored = this.read();
    if (stored !== null) {
      return stored;
    }

    const seeded = this.seed();
    this.persist(seeded);
    return seeded;
  }

  private read(): Reservation[] | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    let raw: string | null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }

    if (raw === null) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed
      .map((entry) => this.normalize(entry))
      .filter((entry): entry is Reservation => entry !== null);
  }

  /** Accepts both the current shape and the PB-09 form's legacy shape. */
  private normalize(entry: unknown): Reservation | null {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const value = entry as Record<string, unknown>;
    const { id, room, date, startTime, endTime, purpose, state } = value;

    const hasId = typeof id === 'string' || typeof id === 'number';

    if (
      !hasId ||
      typeof room !== 'string' ||
      typeof date !== 'string' ||
      typeof startTime !== 'string' ||
      typeof endTime !== 'string' ||
      typeof purpose !== 'string'
    ) {
      return null;
    }

    const normalizedState: ReservationState = state === 'cancelled' ? 'cancelled' : 'confirmed';

    return {
      id: String(id),
      room,
      date,
      startTime,
      endTime,
      purpose,
      state: normalizedState,
    };
  }

  private persist(reservations: Reservation[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    } catch {
      // Storage can be full or blocked; the in-memory list still works.
    }
  }

  /** Demo data: one past and one cancelled booking make the filters useful. */
  private seed(): Reservation[] {
    const at = (offsetDays: number): string => {
      const date = new Date();
      date.setDate(date.getDate() + offsetDays);
      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-');
    };

    return [
      {
        id: 'seed-1',
        room: 'Innovation Lab',
        date: at(2),
        startTime: '10:00',
        endTime: '12:00',
        purpose: 'Design review with the project team',
        state: 'confirmed',
      },
      {
        id: 'seed-2',
        room: 'Study Room A',
        date: at(5),
        startTime: '14:00',
        endTime: '15:30',
        purpose: 'Revision session for the SOA exam',
        state: 'confirmed',
      },
      {
        id: 'seed-3',
        room: 'Conference Room',
        date: at(-6),
        startTime: '09:00',
        endTime: '10:30',
        purpose: 'Sprint review with the client',
        state: 'confirmed',
      },
      {
        id: 'seed-4',
        room: 'Study Room B',
        date: at(-11),
        startTime: '16:00',
        endTime: '18:00',
        purpose: 'Robotics club meetup',
        state: 'cancelled',
      },
    ];
  }
}
