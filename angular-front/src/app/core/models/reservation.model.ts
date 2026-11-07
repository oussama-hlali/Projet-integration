/**
 * Reservation model, aligned with `SmartCampus_ClassDiagram_V0`.
 *
 * A reservation stores real start/end `Date` values plus one of the four
 * diagram statuses. The list still derives an upcoming/past phase so the
 * filter chips remain useful, but the persisted source of truth is `status`.
 */

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
];

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

/** What the list shows and filters on. */
export type ReservationPhase = 'upcoming' | 'past' | 'cancelled';

export interface Reservation {
  id: string;
  roomId: string;
  /** Room name kept alongside the id so every screen can render a row. */
  room: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  status: ReservationStatus;
  userId: string;
}

/** Everything the form collects; the service owns the id and the status. */
export interface CreateReservationInput {
  roomId: string;
  room: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  userId?: string;
}

export type CreateReservationFailure = 'invalid-range' | 'conflict' | 'unavailable';

export type CreateReservationResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; reason: CreateReservationFailure };

export type ReservationStatusFilter = 'all' | ReservationPhase;

export type ReservationCounts = Record<ReservationStatusFilter, number>;
