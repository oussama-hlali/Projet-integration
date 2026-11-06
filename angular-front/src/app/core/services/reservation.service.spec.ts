import { TestBed } from '@angular/core/testing';
import { Reservation } from '../models/reservation.model';
import { ReservationService } from './reservation.service';

const STORAGE_KEY = 'smart-campus-reservations';

describe('ReservationService', () => {
  let service: ReservationService;

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
      room: 'Study Room B',
      date: future(9),
      startTime: '08:00',
      endTime: '09:00',
      purpose: 'Pair programming session',
    });

    expect(result.ok).toBeTrue();
    if (result.ok) {
      expect(result.reservation.state).toBe('confirmed');
    }

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Reservation[];
    expect(stored.some((reservation) => reservation.room === 'Study Room B')).toBeTrue();
  });

  it('refuses an overlapping slot in the same room but allows another room', () => {
    const slot = {
      date: future(4),
      startTime: '10:00',
      endTime: '11:00',
      purpose: 'Overlap checks',
    };

    const first = service.create({ ...slot, room: 'Innovation Lab' });
    const overlap = service.create({ ...slot, room: 'Innovation Lab' });
    const nextDoor = service.create({ ...slot, room: 'Conference Room' });

    expect(first.ok).toBeTrue();
    expect(overlap).toEqual({ ok: false, reason: 'conflict' });
    expect(nextDoor.ok).toBeTrue();
  });

  it('refuses an end time before the start time', () => {
    const result = service.create({
      room: 'Study Room A',
      date: future(2),
      startTime: '12:00',
      endTime: '11:00',
      purpose: 'Backwards booking',
    });

    expect(result).toEqual({ ok: false, reason: 'invalid-range' });
  });

  it('cancels a booking without deleting it from the list', () => {
    const created = service.create({
      room: 'Study Room A',
      date: future(6),
      startTime: '16:00',
      endTime: '17:00',
      purpose: 'Cancellation target',
    });

    expect(created.ok).toBeTrue();
    if (!created.ok) {
      return;
    }

    const before = service.reservations().length;
    const cancelled = service.cancel(created.reservation.id);

    expect(cancelled?.state).toBe('cancelled');
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
    expect(migrated.reservations()[0].state).toBe('confirmed');
  });
});
