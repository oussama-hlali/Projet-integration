export type EventCategory = 'ACADEMIC' | 'SOCIAL' | 'SPORT' | 'CULTURE' | 'CAREER';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  category: EventCategory;
  capacity: number;
  organizerId: string;
}