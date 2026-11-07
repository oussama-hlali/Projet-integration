import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CreateReservationInput,
  CreateReservationResult,
  Reservation,
  ReservationCounts,
  ReservationPhase,
  ReservationStatus,
} from '../models/reservation.model';
import { RoomService } from './room.service';

const STORAGE_KEY = 'smart-campus-reservations';
const DEMO_USER_ID = 'u1';

/**
 * PB-09 — Reservation store.
 *
 * Demo data lives in `localStorage` so the list survives reloads without a
 * backend. The persisted shape follows the class diagram (`startTime` and
 * `endTime` are dates, `status` is one of the four enum values); records from
 * the earlier form (separate date/time strings, `state`) are migrated on read.
 */
@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly rooms = inject(RoomService);
  private readonly state = signal<Reservation[]>(this.load());

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
      status: 'CONFIRMED',
      userId: input.userId ?? DEMO_USER_ID,
    };

    this.commit([...this.state(), reservation]);
    return { ok: true, reservation };
  }

  /** `cancel()` in the diagram: the row stays in the list for history. */
  cancel(id: string): Reservation | undefined {
    const target = this.state().find((reservation) => reservation.id === id);
    if (!target || target.status === 'CANCELLED') {
      return undefined;
    }

    return this.setStatus(id, 'CANCELLED');
  }

  /** Administrator transitions used by the management screens. */
  setStatus(id: string, status: ReservationStatus): Reservation | undefined {
    const target = this.state().find((reservation) => reservation.id === id);
    if (!target) {
      return undefined;
    }

    const updated: Reservation = { ...target, status };
    this.commit(
      this.state().map((reservation) => (reservation.id === id ? updated : reservation)),
    );
    return updated;
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

  private persist(reservations: Reservation[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          reservations.map((reservation) => ({
            ...reservation,
            startTime: reservation.startTime.toISOString(),
            endTime: reservation.endTime.toISOString(),
          })),
        ),
      );
    } catch {
      // Storage can be full or blocked; the in-memory list still works.
    }
  }

  /** Demo data: one past, one cancelled and one pending booking. */
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
