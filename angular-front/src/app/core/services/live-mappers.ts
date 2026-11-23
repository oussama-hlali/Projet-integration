import { CampusEvent, EventCategory, EVENT_CATEGORIES } from '../models/campus-event.model';
import { CafeteriaMenu, CafeteriaOrder, MenuItem } from '../models/cafeteria.model';
import { EventRegistration } from '../models/event-registration.model';
import {
  LostFoundComment,
  LostFoundItem,
  LostFoundStatus,
  LOST_FOUND_STATUSES,
} from '../models/lost-found.model';
import { Notification, NotificationType } from '../models/notification.model';
import { Reservation, ReservationStatus } from '../models/reservation.model';
import { Room, RoomStatus, ROOM_STATUSES } from '../models/room.model';
import {
  TransportDeparture,
  TransportRoute,
  TransportStop,
} from '../models/transport.model';
import { User, UserRole } from '../models/user.model';

/** Backend rows arrive with ISO strings; the UI works with Date objects. */
export function liveDate(value: unknown, fallback: Date = new Date()): Date {
  if (value instanceof Date) return value;
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : value == null ? fallback : String(value);
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((entry) => text(entry)).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
}

export function mapEvent(row: any): CampusEvent {
  const category = EVENT_CATEGORIES.includes(row?.category) ? row.category : 'ACADEMIC';
  return {
    id: text(row?.id),
    title: text(row?.title, 'Untitled event'),
    description: text(row?.description),
    date: liveDate(row?.date),
    endDate: row?.endDate == null ? undefined : liveDate(row.endDate),
    location: text(row?.location),
    category: category as EventCategory,
    capacity: Number(row?.capacity) || 0,
    organizerId: text(row?.organizerId, 'u1'),
    roomId: row?.roomId == null ? undefined : text(row.roomId),
  };
}

export function mapLostFoundComment(row: any): LostFoundComment {
  return {
    id: text(row?.id),
    authorId: text(row?.authorId, 'u1'),
    message: text(row?.message),
    createdAt: liveDate(row?.createdAt),
    taggedUserIds: stringList(row?.taggedUserIds),
  };
}

export function mapLostFound(row: any): LostFoundItem {
  const status: LostFoundStatus = LOST_FOUND_STATUSES.includes(row?.status) ? row.status : 'LOST';
  return {
    id: text(row?.id),
    title: text(row?.title, 'Untitled report'),
    description: text(row?.description),
    location: text(row?.location),
    reportedAt: liveDate(row?.createdAt ?? row?.reportedAt),
    status,
    category: text(row?.category, 'General'),
    contactPhone: row?.contactPhone == null ? undefined : text(row.contactPhone),
    reporterId: text(row?.reporterId, 'u1'),
    taggedUserIds: stringList(row?.taggedUserIds),
    comments: Array.isArray(row?.comments) ? row.comments.map(mapLostFoundComment) : [],
    reactionUserIds: stringList(row?.reactionUserIds),
  };
}

function mapMenuItem(row: any): MenuItem {
  return {
    id: text(row?.id),
    name: text(row?.name, 'Dish'),
    description: text(row?.description),
    dietaryLabels: stringList(row?.dietaryLabels ?? row?.dietaryLabelsCsv),
    allergens: stringList(row?.allergens ?? row?.allergensCsv),
    price: Number(row?.price) || 0,
  };
}

export function mapCafeteriaMenu(row: any): CafeteriaMenu {
  return {
    id: text(row?.id),
    buildingId: text(row?.buildingId),
    building: text(row?.building, 'Cafétéria'),
    date: liveDate(row?.date),
    meal: text(row?.meal, 'Lunch'),
    openingHours: text(row?.openingHours),
    items: Array.isArray(row?.items) ? row.items.map(mapMenuItem) : [],
  };
}

export function mapCafeteriaOrder(row: any): CafeteriaOrder {
  return {
    id: text(row?.id),
    reference: text(row?.reference),
    userId: text(row?.userId, 'u1'),
    menuId: text(row?.menuId),
    itemId: text(row?.itemId),
    itemName: text(row?.itemName, 'Dish'),
    menuLabel: text(row?.menuLabel),
    building: text(row?.building),
    date: liveDate(row?.date),
    pickupTime: text(row?.pickupTime),
    price: Number(row?.price) || 0,
    createdAt: liveDate(row?.createdAt),
    qrPayload: text(row?.qrPayload),
    status: row?.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
  };
}

const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
];

export function mapReservation(row: any): Reservation {
  const status = RESERVATION_STATUSES.includes(row?.status) ? row.status : 'PENDING';
  return {
    id: text(row?.id),
    roomId: text(row?.roomId),
    room: text(row?.room ?? row?.roomName, 'Room'),
    startTime: liveDate(row?.startTime),
    endTime: liveDate(row?.endTime),
    purpose: text(row?.purpose),
    status,
    userId: text(row?.userId, 'u1'),
  };
}

const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'ANNOUNCEMENT',
  'EVENT',
  'RESERVATION',
  'LOST_FOUND',
  'SYSTEM',
];

/** The backend stores the association id in `eventId`; the type tells us which field it is. */
export function mapNotification(row: any): Notification {
  const type = NOTIFICATION_TYPES.includes(row?.type) ? row.type : 'SYSTEM';
  const targetId = row?.eventId == null ? undefined : text(row.eventId);
  return {
    id: text(row?.id),
    message: text(row?.message),
    createdAt: liveDate(row?.createdAt),
    read: Boolean(row?.read),
    userId: text(row?.userId, 'u1'),
    type,
    announcementId: type === 'ANNOUNCEMENT' ? targetId : undefined,
    eventId: type === 'EVENT' ? targetId : undefined,
    reservationId: type === 'RESERVATION' ? targetId : undefined,
    lostFoundId: type === 'LOST_FOUND' ? targetId : undefined,
  };
}

export function mapUser(row: any): User {
  const role: UserRole = row?.role === 'ADMINISTRATOR' ? 'ADMINISTRATOR' : 'STUDENT';
  return {
    id: text(row?.id),
    fullName: text(row?.fullName, 'Student'),
    email: text(row?.email),
    role,
    avatarUrl: 'assets/avatars/default.png',
    preferences: {
      language: text(row?.language, 'en'),
      notificationsEnabled: row?.notificationsEnabled !== false,
      theme: text(row?.theme, 'light'),
    },
    passwordHash: '',
    salt: '',
    totpSecret: '',
    totpEnabled: Boolean(row?.totpEnabled),
  };
}

/** The campus room table stores `type`, not the UI's `facilities` list. */
export function mapRoom(row: any, buildingName?: string): Room {
  const status: RoomStatus = ROOM_STATUSES.includes(row?.status) ? row.status : 'AVAILABLE';
  const facilities = Array.isArray(row?.facilities)
    ? row.facilities.map((entry: unknown) => text(entry)).filter(Boolean)
    : row?.type
      ? [text(row.type)]
      : [];
  return {
    id: text(row?.id),
    name: text(row?.name, 'Room'),
    buildingId: text(row?.buildingId),
    building: text(row?.building ?? buildingName),
    capacity: Number(row?.capacity) || 0,
    facilities,
    status,
  };
}

export function mapEventRegistration(row: any, eventId?: string, userId?: string): EventRegistration {
  return {
    id: text(row?.id),
    registeredAt: liveDate(row?.createdAt ?? row?.registeredAt),
    qrCode: text(row?.qrCode),
    userId: text(row?.userId ?? userId),
    eventId: text(row?.eventId ?? eventId),
  };
}

export function mapTransportRoute(row: any): TransportRoute {
  return {
    id: text(row?.id),
    name: text(row?.name, 'Route'),
    color: text(row?.color, '#0c6f6b'),
  };
}

export function mapTransportStop(row: any): TransportStop {
  return {
    id: text(row?.id),
    routeId: text(row?.routeId),
    name: text(row?.name, 'Stop'),
    order: Number(row?.order ?? row?.sequence) || 0,
  };
}

function clockTime(value: unknown): string {
  const raw = text(value);
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '08:00';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function mapTransportDeparture(row: any): TransportDeparture {
  return {
    id: text(row?.id),
    stopId: text(row?.stopId),
    time: clockTime(row?.time ?? row?.departureTime),
    // The backend timetable currently has no day pattern; weekdays is the safe default.
    days: text(row?.days, 'Mon-Fri'),
  };
}
