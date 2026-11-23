import {
  mapCafeteriaMenu,
  mapCafeteriaOrder,
  mapEvent,
  mapEventRegistration,
  mapLostFound,
  mapNotification,
  mapReservation,
  mapRoom,
  mapTransportDeparture,
  mapTransportRoute,
  mapTransportStop,
  mapUser,
} from './live-mappers';

describe('live mappers', () => {
  it('turns backend ISO strings into UI dates and keeps optional fields', () => {
    const event = mapEvent({
      id: 'e1',
      title: 'Forum',
      date: '2026-11-20T10:00:00Z',
      endDate: '2026-11-20T12:00:00Z',
      category: 'CAREER',
      capacity: 120,
      roomId: 'room-1',
    });

    expect(event.date instanceof Date).toBeTrue();
    expect(event.endDate instanceof Date).toBeTrue();
    expect(event.roomId).toBe('room-1');
    expect(mapEvent({ id: 'e2', category: 'UNKNOWN' }).category).toBe('ACADEMIC');
  });

  it('maps the cafeteria split menu/items and cancelled receipts', () => {
    const menu = mapCafeteriaMenu({
      id: 'm1',
      date: '2026-11-23T00:00:00Z',
      items: [{ id: 'i1', name: 'Couscous', dietaryLabelsCsv: 'Halal,Vegetarian', allergensCsv: 'Gluten', price: 8 }],
    });

    expect(menu.items[0].dietaryLabels).toEqual(['Halal', 'Vegetarian']);
    expect(menu.items[0].allergens).toEqual(['Gluten']);

    const order = mapCafeteriaOrder({ id: 'o1', status: 'CANCELLED', createdAt: '2026-11-23T12:00:00Z' });
    expect(order.status).toBe('CANCELLED');
    expect(order.createdAt instanceof Date).toBeTrue();
  });

  it('maps campus rooms and reservations without leaking backend field names', () => {
    const room = mapRoom(
      { id: 'r1', name: 'Lab', buildingId: 'b1', capacity: 30, status: 'MAINTENANCE', type: 'LAB' },
      'Science Block',
    );
    expect(room.facilities).toEqual(['LAB']);
    expect(room.building).toBe('Science Block');
    expect(room.status).toBe('MAINTENANCE');

    const reservation = mapReservation({
      id: 'res1',
      roomName: 'Lab',
      startTime: '2026-11-24T08:00:00Z',
      endTime: '2026-11-24T09:00:00Z',
      status: 'CONFIRMED',
    });
    expect(reservation.room).toBe('Lab');
    expect(reservation.endTime instanceof Date).toBeTrue();
  });

  it('maps engagement rows and notification associations', () => {
    const report = mapLostFound({
      id: 'lf1',
      title: 'Keys',
      createdAt: '2026-11-22T10:00:00Z',
      taggedUserIds: 'u1,u2',
      reactionUserIds: ['u3'],
      comments: [{ id: 'c1', createdAt: '2026-11-22T11:00:00Z', taggedUserIds: ['u1'] }],
    });
    expect(report.taggedUserIds).toEqual(['u1', 'u2']);
    expect(report.reactionUserIds).toEqual(['u3']);
    expect(report.comments[0].createdAt instanceof Date).toBeTrue();

    const registration = mapEventRegistration(
      { id: 'reg1', createdAt: '2026-11-22T09:00:00Z', qrCode: 'QR-1' },
      'e1',
      'u1',
    );
    expect(registration.eventId).toBe('e1');
    expect(registration.qrCode).toBe('QR-1');

    const notification = mapNotification({ id: 'n1', type: 'RESERVATION', eventId: 'res1' });
    expect(notification.reservationId).toBe('res1');
    expect(notification.eventId).toBeUndefined();
  });

  it('maps transport rows and normalises the clock format', () => {
    expect(mapTransportRoute({ id: 't1', name: 'Campus', color: '#123456' }).color).toBe('#123456');
    expect(mapTransportStop({ id: 's1', sequence: 3, routeId: 't1' }).order).toBe(3);
    expect(mapTransportDeparture({ id: 'd1', stopId: 's1', departureTime: '08:05:00' }).time).toBe('08:05');
  });

  it('falls back to a student role and a default room status', () => {
    expect(mapUser({ id: 'u1', role: 'ROOT' }).role).toBe('STUDENT');
    expect(mapRoom({ id: 'r2' }).status).toBe('AVAILABLE');
  });
});
