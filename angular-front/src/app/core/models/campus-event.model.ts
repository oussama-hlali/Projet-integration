/**
 * Campus events shown on the dashboard and the Events page.
 *
 * Categories live in one tuple so the filter chips, the badges and the demo
 * data cannot drift apart.
 */
export const EVENT_CATEGORIES = ['ACADEMIC', 'SOCIAL', 'SPORT', 'CULTURE', 'CAREER'] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/** English UI labels for the categories used in the demo data. */
export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  ACADEMIC: 'Academic',
  SOCIAL: 'Social',
  SPORT: 'Sport',
  CULTURE: 'Culture',
  CAREER: 'Career',
};

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  /** When the event finishes; falls back to a two-hour slot when omitted. */
  endDate?: Date;
  location: string;
  category: EventCategory;
  capacity: number;
  organizerId: string;
}
