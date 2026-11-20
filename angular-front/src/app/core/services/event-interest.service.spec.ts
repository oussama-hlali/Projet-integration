import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { EventInterestService } from './event-interest.service';

const STORAGE_KEY = 'smart-campus.event-interests';

describe('EventInterestService', () => {
  let service: EventInterestService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
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

  it('toggles an interest on and off', () => {
    expect(service.toggle('e10', 'u2')).toBeTrue();
    expect(service.isInterested('e10', 'u2')).toBeTrue();

    expect(service.toggle('e10', 'u2')).toBeFalse();
    expect(service.isInterested('e10', 'u2')).toBeFalse();
  });

  it('returns user event ids without touching another student', () => {
    service.toggle('e1', 'u2');

    expect(service.interestedEventIds('u2')).toEqual(['e1']);
    expect(service.interestedEventIds().length).toBe(3);
    expect(service.interestsFor().every((interest) => interest.userId === 'u1')).toBeTrue();
  });

});
