import { CampusEvent } from '../../core/models/campus-event.model';
import { categoryLabel, categoryVariant, eventEnd, isPastEvent } from './event-meta';

function makeEvent(overrides: Partial<CampusEvent> = {}): CampusEvent {
  return {
    id: 'test',
    title: 'Test event',
    description: 'A test event.',
    date: new Date('2026-11-10T10:00:00'),
    location: 'Amphi A',
    category: 'ACADEMIC',
    capacity: 50,
    organizerId: 'u3',
    ...overrides,
  };
}

describe('event meta', () => {
  it('labels every category in English', () => {
    expect(categoryLabel('ACADEMIC')).toBe('Academic');
    expect(categoryLabel('SOCIAL')).toBe('Social');
    expect(categoryLabel('SPORT')).toBe('Sport');
    expect(categoryLabel('CULTURE')).toBe('Culture');
    expect(categoryLabel('CAREER')).toBe('Career');
  });

  it('maps every category to a badge variant', () => {
    expect(categoryVariant('ACADEMIC')).toBe('info');
    expect(categoryVariant('SOCIAL')).toBe('success');
    expect(categoryVariant('SPORT')).toBe('warning');
    expect(categoryVariant('CULTURE')).toBe('neutral');
    expect(categoryVariant('CAREER')).toBe('info');
  });

  it('uses the explicit end date when the event has one', () => {
    const endDate = new Date('2026-11-10T12:30:00');
    expect(eventEnd(makeEvent({ endDate }))).toBe(endDate);
  });

  it('falls back to a two-hour slot when no end date is set', () => {
    const event = makeEvent();
    expect(eventEnd(event).getTime()).toBe(event.date.getTime() + 2 * 60 * 60 * 1000);
  });

  it('treats an event as past only after it ends', () => {
    const event = makeEvent({
      date: new Date('2026-11-10T10:00:00'),
      endDate: new Date('2026-11-10T12:00:00'),
    });

    expect(isPastEvent(event, new Date('2026-11-10T11:59:00'))).toBeFalse();
    expect(isPastEvent(event, new Date('2026-11-10T12:00:00'))).toBeFalse();
    expect(isPastEvent(event, new Date('2026-11-10T12:00:01'))).toBeTrue();
  });
});
