import { TestBed } from '@angular/core/testing';
import { EventInterestService } from './event-interest.service';

const STORAGE_KEY = 'smart-campus.event-interests';

describe('EventInterestService', () => {
  let service: EventInterestService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventInterestService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('seeds followed events for the demo student', () => {
    expect(service.interestsFor().length).toBe(3);
    expect(service.isInterested('e2')).toBeTrue();
    expect(service.isInterested('e1')).toBeFalse();
    expect(service.isInterested('e2', 'u2')).toBeFalse();
  });

  it('toggles an interest on and off and persists each change', () => {
    expect(service.toggle('e10', 'u2')).toBeTrue();
    expect(service.isInterested('e10', 'u2')).toBeTrue();

    let stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Array<{
      eventId: string;
      userId: string;
    }>;
    expect(stored.some((entry) => entry.eventId === 'e10' && entry.userId === 'u2')).toBeTrue();

    expect(service.toggle('e10', 'u2')).toBeFalse();
    expect(service.isInterested('e10', 'u2')).toBeFalse();

    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Array<{
      eventId: string;
      userId: string;
    }>;
    expect(stored.some((entry) => entry.eventId === 'e10' && entry.userId === 'u2')).toBeFalse();
  });

  it('returns user event ids without touching another student', () => {
    service.toggle('e1', 'u2');

    expect(service.interestedEventIds('u2')).toEqual(['e1']);
    expect(service.interestedEventIds().length).toBe(3);
    expect(service.interestsFor().every((interest) => interest.userId === 'u1')).toBeTrue();
  });

  it('reloads saved interests as dates after a fresh start', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          eventId: 'e9',
          userId: 'u2',
          createdAt: '2026-11-11T08:30:00.000Z',
        },
      ]),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(EventInterestService);
    const interests = reloaded.interestsFor('u2');

    expect(interests.length).toBe(1);
    expect(interests[0].eventId).toBe('e9');
    expect(interests[0].createdAt instanceof Date).toBeTrue();
  });
});
