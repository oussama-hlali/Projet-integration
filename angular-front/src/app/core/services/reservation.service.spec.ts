import { TestBed } from '@angular/core/testing';
import { Reservation } from '../models/reservation.model';
import { ReservationService } from './reservation.service';

const STORAGE_KEY = 'smart-campus-reservations';

describe('ReservationService', () => {
  let service: ReservationService;

  /** A local date `offsetDays` away at the given 24h `HH:mm` time. */
  const moment = (offsetDays: number, time: string): Date => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const [hours, minutes] = time.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const future = (offsetDays = 3): string => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReservationService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('seeds demo bookings so the filters have something to show', () => {
    expect(service.reservations().length).toBeGreaterThan(0);
    expect(service.counts().upcoming).toBeGreaterThan(0);
    expect(service.counts().cancelled).toBeGreaterThan(0);
  });

  it('creates a confirmed booking and persists it', () => {
    const result = service.create({
      roomId: 'room-13',
      room: 'Study Room B',
      startTime: moment(9, '08:00'),
      endTime: moment(9, '09:00'),
      purpose: 'Pair programming session',
    });

    expect(result.ok).toBeTrue();
    if (result.ok) {
      expect(result.reservation.status).toBe('CONFIRMED');
      expect(result.reservation.startTime instanceof Date).toBeTrue();
      expect(result.reservation.endTime instanceof Date).toBeTrue();
    }

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Array<{
      room: string;
    }>;
    expect(stored.some((reservation) => reservation.room === 'Study Room B')).toBeTrue();
  });

  it('refuses an overlapping slot in the same room but allows another room', () => {
    const slot = {
      roomId: 'room-11',
      room: 'Innovation Lab',
      startTime: moment(4, '10:00'),
      endTime: moment(4, '11:00'),
      purpose: 'Overlap checks',
    };

    const first = service.create(slot);
    const overlap = service.create(slot);
    const nextDoor = service.create({
      ...slot,
      roomId: 'room-14',
      room: 'Conference Room',
    });

    expect(first.ok).toBeTrue();
    expect(overlap).toEqual({ ok: false, reason: 'conflict' });
    expect(nextDoor.ok).toBeTrue();
  });

  it('refuses an end time before the start time', () => {
    const result = service.create({
      roomId: 'room-12',
      room: 'Study Room A',
      startTime: moment(2, '12:00'),
      endTime: moment(2, '11:00'),
      purpose: 'Backwards booking',
    });

    expect(result).toEqual({ ok: false, reason: 'invalid-range' });
  });

  it('refuses a room that is under maintenance', () => {
    const result = service.create({
      roomId: 'room-4',
      room: 'Salle 07',
      startTime: moment(3, '09:00'),
      endTime: moment(3, '10:00'),
      purpose: 'Maintenance check',
    });

    expect(result).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('cancels a booking without deleting it from the list', () => {
    const created = service.create({
      roomId: 'room-12',
      room: 'Study Room A',
      startTime: moment(6, '16:00'),
      endTime: moment(6, '17:00'),
      purpose: 'Cancellation target',
    });

    expect(created.ok).toBeTrue();
    if (!created.ok) {
      return;
    }

    const before = service.reservations().length;
    const cancelled = service.cancel(created.reservation.id);

    expect(cancelled?.status).toBe('CANCELLED');
    expect(service.reservations().length).toBe(before);
    expect(service.phaseOf(cancelled as Reservation)).toBe('cancelled');
    expect(service.cancel(created.reservation.id)).toBeUndefined();
  });

  it('migrates legacy rows written before the state field existed', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 1,
          room: 'Innovation Lab',
          date: future(3),
          startTime: '09:00',
          endTime: '10:00',
          purpose: 'Legacy booking',
        },
      ]),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const migrated = TestBed.inject(ReservationService);

    expect(migrated.reservations().length).toBe(1);
    expect(migrated.reservations()[0].id).toBe('1');
    expect(migrated.reservations()[0].status).toBe('CONFIRMED');
    expect(migrated.reservations()[0].roomId).toBe('room-11');
  });
});
