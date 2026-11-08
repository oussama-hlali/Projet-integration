import { Injectable, computed, inject } from '@angular/core';

import { AnnouncementService } from './announcement.service';
import { CampusEventService } from './campus-event.service';
import { CafeteriaService } from './cafeteria.service';
import { LostFoundService } from './lost-found.service';
import { NotificationService } from './notification.service';
import { ReservationService } from './reservation.service';
import { RoomService } from './room.service';
import { TransportService } from './transport.service';
import { UserService } from './user.service';

/**
 * Cross-domain KPIs and analytics for the admin dashboard.
 *
 * All values are computed signals, so any change in the underlying stores
 * (a new reservation, a claimed item, a new user) is reflected immediately.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly rooms = inject(RoomService);
  private readonly events = inject(CampusEventService);
  private readonly announcements = inject(AnnouncementService);
  private readonly reservations = inject(ReservationService);
  private readonly lostFound = inject(LostFoundService);
  private readonly notifications = inject(NotificationService);
  private readonly users = inject(UserService);
  private readonly cafeteria = inject(CafeteriaService);
  private readonly transport = inject(TransportService);

  // ── Rooms ──────────────────────────────────────────────────────────────────
  readonly roomsTotal = computed(() => this.rooms.rooms().length);
  readonly roomsAvailable = computed(
    () => this.rooms.rooms().filter((room) => room.status === 'AVAILABLE').length,
  );
  readonly roomsOccupied = computed(
    () => this.rooms.rooms().filter((room) => room.status === 'OCCUPIED').length,
  );
  readonly roomsReserved = computed(
    () => this.rooms.rooms().filter((room) => room.status === 'RESERVED').length,
  );
  readonly roomsMaintenance = computed(
    () => this.rooms.rooms().filter((room) => room.status === 'MAINTENANCE').length,
  );
  readonly totalSeats = computed(() =>
    this.rooms.rooms().reduce((seats, room) => seats + room.capacity, 0),
  );
  readonly occupancyRate = computed(() => {
    const total = this.roomsTotal();
    if (!total) {
      return 0;
    }
    return (this.roomsOccupied() + this.roomsReserved()) / total;
  });

  // ── Events ─────────────────────────────────────────────────────────────────
  readonly eventsTotal = computed(() => this.events.events().length);
  readonly upcomingEvents = computed(() => {
    const now = new Date();
    return this.events.events().filter((event) => event.date.getTime() >= now.getTime()).length;
  });
  readonly pastEvents = computed(() => this.eventsTotal() - this.upcomingEvents());

  // ── Reservations ───────────────────────────────────────────────────────────
  readonly reservationsTotal = computed(() => this.reservations.reservations().length);
  readonly pendingReservations = computed(
    () => this.reservations.reservations().filter((r) => r.status === 'PENDING').length,
  );
  readonly confirmedReservations = computed(
    () => this.reservations.reservations().filter((r) => r.status === 'CONFIRMED').length,
  );
  readonly cancelledReservations = computed(
    () => this.reservations.reservations().filter((r) => r.status === 'CANCELLED').length,
  );
  readonly completedReservations = computed(
    () => this.reservations.reservations().filter((r) => r.status === 'COMPLETED').length,
  );

  // ── Announcements ──────────────────────────────────────────────────────────
  readonly announcementsTotal = computed(() => this.announcements.announcements().length);
  readonly pinnedAnnouncements = computed(
    () => this.announcements.announcements().filter((a) => a.pinned).length,
  );

  // ── Lost & Found ───────────────────────────────────────────────────────────
  readonly lostFoundTotal = computed(() => this.lostFound.items().length);
  readonly openLostFound = computed(
    () => this.lostFound.items().filter((item) => item.status !== 'CLAIMED').length,
  );
  readonly claimedLostFound = computed(
    () => this.lostFound.items().filter((item) => item.status === 'CLAIMED').length,
  );

  // ── Users ──────────────────────────────────────────────────────────────────
  readonly usersTotal = computed(() => this.users.users().length);
  readonly studentsCount = computed(
    () => this.users.users().filter((user) => user.role === 'STUDENT').length,
  );
  readonly adminsCount = computed(
    () => this.users.users().filter((user) => user.role === 'ADMINISTRATOR').length,
  );

  // ── Notifications ──────────────────────────────────────────────────────────
  readonly unreadNotifications = computed(() => this.notifications.unreadCount());

  // ── Transport / Cafeteria ──────────────────────────────────────────────────
  readonly transportRoutes = computed(() => this.transport.routes().length);
  readonly transportStops = computed(() =>
    this.transport.routeViews().reduce((count, route) => count + route.stops.length, 0),
  );
  readonly todayMenu = this.cafeteria.todayMenu;
}
