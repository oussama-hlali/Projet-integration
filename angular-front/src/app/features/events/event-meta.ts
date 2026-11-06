import {
  CampusEvent,
  EVENT_CATEGORY_LABELS,
  EventCategory,
} from '../../core/models/campus-event.model';
import { BadgeVariant } from '../../shared/components';

/**
 * Shared presenters for the Events list and the event detail page, so the
 * category colours and the "past" rule stay identical in both places.
 */
const CATEGORY_VARIANTS: Record<EventCategory, BadgeVariant> = {
  ACADEMIC: 'info',
  SOCIAL: 'success',
  SPORT: 'warning',
  CULTURE: 'neutral',
  CAREER: 'info',
};

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

export function categoryLabel(category: EventCategory): string {
  return EVENT_CATEGORY_LABELS[category];
}

export function categoryVariant(category: EventCategory): BadgeVariant {
  return CATEGORY_VARIANTS[category];
}

/** The moment the event is over; events without an end time last two hours. */
export function eventEnd(event: CampusEvent): Date {
  return event.endDate ?? new Date(event.date.getTime() + DEFAULT_DURATION_MS);
}

export function isPastEvent(event: CampusEvent, now: Date = new Date()): boolean {
  return eventEnd(event).getTime() < now.getTime();
}
