export type AnnouncementCategory = 'GENERAL' | 'ACADEMIC' | 'ADMINISTRATIVE' | 'EVENTS' | 'MAINTENANCE';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  publishedAt: Date;
  category: AnnouncementCategory;
  pinned: boolean;
  authorId: string;
}