/**
 * Notification model, aligned with `SmartCampus_ClassDiagram_V0`.
 *
 * A notification points at the announcement, event or reservation it is about
 * when one exists, which is the `0..*` association in the diagram.
 */

export type NotificationType = 'ANNOUNCEMENT' | 'EVENT' | 'RESERVATION' | 'LOST_FOUND' | 'SYSTEM';

export interface Notification {
  id: string;
  message: string;
  createdAt: Date;
  read: boolean;
  userId: string;
  type: NotificationType;
  announcementId?: string;
  eventId?: string;
  reservationId?: string;
  lostFoundId?: string;
  /** Explicit destination for notifications that do not map to an entity. */
  actionUrl?: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  ANNOUNCEMENT: 'Announcement',
  EVENT: 'Event',
  RESERVATION: 'Reservation',
  LOST_FOUND: 'Lost & Found',
  SYSTEM: 'System',
};
