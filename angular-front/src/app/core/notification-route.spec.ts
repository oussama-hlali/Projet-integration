import { Notification, NotificationType } from './models/notification.model';
import { notificationRoute } from './notification-route';

function notification(type: NotificationType, extra: Partial<Notification> = {}): Notification {
  return {
    id: 'n-test',
    message: 'Test notification',
    createdAt: new Date('2026-11-09T08:00:00'),
    read: false,
    userId: 'u1',
    type,
    ...extra,
  };
}

describe('notificationRoute', () => {
  it('opens the exact event detail for student event notifications', () => {
    expect(notificationRoute(notification('EVENT', { eventId: 'e6' }), 'student')).toBe(
      '/events/e6',
    );
  });

  it('falls back to the event list when the event id is missing', () => {
    expect(notificationRoute(notification('EVENT'), 'student')).toBe('/events');
  });

  it('maps student notifications to their matching campus pages', () => {
    expect(notificationRoute(notification('ANNOUNCEMENT'), 'student')).toBe('/announcements');
    expect(notificationRoute(notification('RESERVATION'), 'student')).toBe('/reservations');
    expect(notificationRoute(notification('LOST_FOUND'), 'student')).toBe('/lost-found');
  });

  it('uses an explicit action for system notifications', () => {
    expect(
      notificationRoute(notification('SYSTEM', { actionUrl: '/cafeteria' }), 'student'),
    ).toBe('/cafeteria');
    expect(notificationRoute(notification('SYSTEM'), 'student')).toBe('/dashboard');
  });

  it('keeps administrators inside the admin area', () => {
    expect(notificationRoute(notification('RESERVATION'), 'admin')).toBe('/admin/reservations');
    expect(notificationRoute(notification('EVENT', { eventId: 'e6' }), 'admin')).toBe(
      '/admin/events',
    );
    expect(notificationRoute(notification('ANNOUNCEMENT'), 'admin')).toBe(
      '/admin/announcements',
    );
    expect(notificationRoute(notification('LOST_FOUND'), 'admin')).toBe('/admin/lost-found');
    expect(notificationRoute(notification('SYSTEM'), 'admin')).toBe('/admin');
  });
});
