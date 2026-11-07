export type AnnouncementCategory =
  | 'GENERAL'
  | 'ACADEMIC'
  | 'ADMINISTRATIVE'
  | 'EVENTS'
  | 'MAINTENANCE';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  publishedAt: Date;
  category: AnnouncementCategory;
  pinned: boolean;
  authorId: string;
}

/** Display order for the category chips on the announcements page. */
export const ANNOUNCEMENT_CATEGORIES: readonly AnnouncementCategory[] = [
  'GENERAL',
  'ACADEMIC',
  'ADMINISTRATIVE',
  'EVENTS',
  'MAINTENANCE',
];

/** English chrome labels; the announcement content itself stays French. */
export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  GENERAL: 'General',
  ACADEMIC: 'Academic',
  ADMINISTRATIVE: 'Administrative',
  EVENTS: 'Events',
  MAINTENANCE: 'Maintenance',
};
