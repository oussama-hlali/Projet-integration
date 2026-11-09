import { Notification } from './models/notification.model';

export type NotificationAudience = 'student' | 'admin';

/**
 * Resolve the page a notification should open.
 *
 * Students open the specific event when the notification carries an id (the
 * event detail route exists); every other type opens the matching list page.
 * Administrators are kept inside `/admin/**`, because the student routes would
 * immediately redirect them back to the admin area.
 *
 * `SYSTEM` notifications have no entity, so they can carry an explicit
 * `actionUrl` (for example the cafeteria page).
 */
export function notificationRoute(
  notification: Notification,
  audience: NotificationAudience,
): string {
  if (audience === 'admin') {
    switch (notification.type) {
      case 'RESERVATION':
        return '/admin/reservations';
      case 'EVENT':
        return '/admin/events';
      case 'ANNOUNCEMENT':
        return '/admin/announcements';
      case 'LOST_FOUND':
        return '/admin/lost-found';
      default:
        return '/admin';
    }
  }

  switch (notification.type) {
    case 'EVENT':
      return notification.eventId ? `/events/${notification.eventId}` : '/events';
    case 'RESERVATION':
      return '/reservations';
    case 'ANNOUNCEMENT':
      return '/announcements';
    case 'LOST_FOUND':
      return '/lost-found';
    default:
      return notification.actionUrl ?? '/dashboard';
  }
}
