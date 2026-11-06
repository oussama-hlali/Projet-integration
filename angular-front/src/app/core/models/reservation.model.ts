/**
 * PB-09 — Room reservations.
 *
 * Rooms live in one tuple so the booking form, the filter bar and the demo
 * data cannot drift apart.
 */
export const RESERVATION_ROOMS = [
  'Innovation Lab',
  'Study Room A',
  'Study Room B',
  'Conference Room',
] as const;

export type ReservationRoom = (typeof RESERVATION_ROOMS)[number];

/**
 * What we persist. A booking is confirmed until the student cancels it;
 * "past" is derived from the clock rather than stored, so a booking cannot
 * go stale if the tab stays open for days.
 */
export type ReservationState = 'confirmed' | 'cancelled';

/** What the list shows and filters on. */
export type ReservationPhase = 'upcoming' | 'past' | 'cancelled';

export interface Reservation {
  id: string;
  room: string;
  /** Local ISO date, `YYYY-MM-DD`. */
  date: string;
  /** 24h clock, `HH:mm`. */
  startTime: string;
  endTime: string;
  purpose: string;
  state: ReservationState;
}

/** Everything the form collects; the service owns the id and state. */
export type CreateReservationInput = Omit<Reservation, 'id' | 'state'>;

export type CreateReservationFailure = 'invalid-range' | 'conflict';

export type CreateReservationResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; reason: CreateReservationFailure };

export type ReservationStatusFilter = 'all' | ReservationPhase;

export type ReservationCounts = Record<ReservationStatusFilter, number>;
