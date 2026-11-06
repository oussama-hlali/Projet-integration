export type FeedCategory = 'Annonces' | 'Examens' | 'Événements' | 'Administration';

export interface FeedItem {
  id: number;
  title: string;
  content: string;
  category: FeedCategory;
  date: string;
  pinned: boolean;
  read: boolean;
}