import { TestBed } from '@angular/core/testing';
import { CampusEvent, EVENT_CATEGORIES } from '../models/campus-event.model';
import { CampusEventService } from './campus-event.service';

describe('CampusEventService', () => {
  let service: CampusEventService;
  let events: CampusEvent[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CampusEventService);
    events = [];
    service.getEvents().subscribe((value) => (events = value));
  });

  it('seeds enough events for the list and every category filter', () => {
    expect(events.length).toBeGreaterThanOrEqual(10);

    for (const category of EVENT_CATEGORIES) {
      expect(events.some((event) => event.category === category))
        .withContext(`${category} should have at least one event`)
        .toBeTrue();
    }
  });

  it('keeps both past and upcoming events in the demo data', () => {
    const now = new Date();

    expect(events.some((event) => event.date.getTime() < now.getTime())).toBeTrue();
    expect(events.some((event) => event.date.getTime() > now.getTime())).toBeTrue();
  });

  it('finds an event by id', () => {
    expect(service.findById('e1')?.title).toBe('Journée portes ouvertes');
  });

  it('returns undefined for an unknown id', () => {
    expect(service.findById('missing')).toBeUndefined();
  });
});
