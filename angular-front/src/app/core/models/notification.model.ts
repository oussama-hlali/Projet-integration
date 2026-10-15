export interface Notification {
  id: string;
  message: string;
  createdAt: Date;
  read: boolean;
  userId: string;
  announcementId?: string;
  eventId?: string;
}