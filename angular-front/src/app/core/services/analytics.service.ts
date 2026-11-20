import { Injectable, computed, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { HttpAnalyticsService } from './http-analytics.service';
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
 * In mock mode values are computed signals over the in-memory stores, so any
 * change is reflected immediately. In production (`useMocks: false`) the same
 * signals are backed by real per-service KPI endpoints — they stay at zero
 * until data is created through the UI and persisted by the backend.
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
  private readonly httpAnalytics = inject(HttpAnalyticsService);

  /** Backend snapshot; empty until the KPI endpoints answer. */
  private readonly remote = computed(() => this.httpAnalytics.data());

  /** Reads a real KPI value, or 0 while unavailable/no data exists yet. */
  private kpi(key: string): number {
    const value = this.remote()[key];
    return typeof value === 'number' ? value : 0;
  }

  /** True when KPIs must come from the backend rather than mock stores. */
  private get live(): boolean { return !environment.useMocks; }

  constructor() {
    if (this.live) {
      this.httpAnalytics.refresh().subscribe();
    }
  }

  /** Call after a mutation so the dashboard reflects newly persisted data. */
  refresh(): void {
    if (this.live) this.httpAnalytics.refresh().subscribe();
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────
  readonly roomsTotal = computed(() => this.live ? this.kpi('roomsTotal') : this.rooms.rooms().length);
  readonly roomsAvailable = computed(() => this.live
    ? this.kpi('roomsAvailable')
    : this.rooms.rooms().filter((room) => room.status === 'AVAILABLE').length);
  readonly roomsOccupied = computed(() => this.live
    ? this.kpi('roomsOccupied')
    : this.rooms.rooms().filter((room) => room.status === 'OCCUPIED').length);
  readonly roomsReserved = computed(() => this.live
    ? this.kpi('roomsReserved')
    : this.rooms.rooms().filter((room) => room.status === 'RESERVED').length);
  readonly roomsMaintenance = computed(() => this.live
    ? this.kpi('roomsMaintenance')
    : this.rooms.rooms().filter((room) => room.status === 'MAINTENANCE').length);
  readonly totalSeats = computed(() =>
    this.rooms.rooms().reduce((seats, room) => seats + room.capacity, 0));
  readonly occupancyRate = computed(() => {
    const total = this.roomsTotal();
    if (!total) return 0;
    return (this.roomsOccupied() + this.roomsReserved()) / total;
  });

  // ── Events ─────────────────────────────────────────────────────────────────
  readonly eventsTotal = computed(() => this.live ? this.kpi('eventsTotal') : this.events.events().length);
  readonly upcomingEvents = computed(() => {
    if (this.live) return this.kpi('upcomingEvents');
    const now = new Date();
    return this.events.events().filter((event) => event.date.getTime() >= now.getTime()).length;
  });
  readonly pastEvents = computed(() => this.eventsTotal() - this.upcomingEvents());

  // ── Reservations ───────────────────────────────────────────────────────────
  readonly reservationsTotal = computed(() => this.live
    ? this.kpi('reservationsTotal') : this.reservations.reservations().length);
  readonly pendingReservations = computed(() => this.live
    ? this.kpi('reservationsPending')
    : this.reservations.reservations().filter((r) => r.status === 'PENDING').length);
  readonly confirmedReservations = computed(() => this.live
    ? this.kpi('reservationsConfirmed')
    : this.reservations.reservations().filter((r) => r.status === 'CONFIRMED').length);
  readonly cancelledReservations = computed(() => this.live
    ? this.kpi('reservationsCancelled')
    : this.reservations.reservations().filter((r) => r.status === 'CANCELLED').length);
  readonly completedReservations = computed(() => this.live
    ? this.kpi('reservationsCompleted')
    : this.reservations.reservations().filter((r) => r.status === 'COMPLETED').length);

  // ── Announcements ──────────────────────────────────────────────────────────
  readonly announcementsTotal = computed(() => this.live
    ? this.kpi('announcementsTotal') : this.announcements.announcements().length);
  readonly pinnedAnnouncements = computed(() =>
    this.announcements.announcements().filter((a) => a.pinned).length);

  // ── Lost & Found ───────────────────────────────────────────────────────────
  readonly lostFoundTotal = computed(() => this.live ? this.kpi('lostFoundTotal') : this.lostFound.items().length);
  readonly openLostFound = computed(() => this.live
    ? this.kpi('lostFoundOpen')
    : this.lostFound.items().filter((item) => item.status !== 'CLAIMED').length);
  readonly claimedLostFound = computed(() => this.live
    ? this.kpi('lostFoundClaimed')
    : this.lostFound.items().filter((item) => item.status === 'CLAIMED').length);

  // ── Users ──────────────────────────────────────────────────────────────────
  readonly usersTotal = computed(() => this.live ? this.kpi('usersTotal') : this.users.users().length);
  readonly studentsCount = computed(() => this.live
    ? this.kpi('studentsCount')
    : this.users.users().filter((user) => user.role === 'STUDENT').length);
  readonly adminsCount = computed(() => this.live
    ? this.kpi('adminsCount')
    : this.users.users().filter((user) => user.role === 'ADMINISTRATOR').length);

  // ── Notifications ──────────────────────────────────────────────────────────
  readonly unreadNotifications = computed(() => this.live
    ? this.kpi('notificationsUnread') : this.notifications.unreadCount());

  // ── Transport / Cafeteria ──────────────────────────────────────────────────
  readonly transportRoutes = computed(() => this.live
    ? this.kpi('transportRoutes') : this.transport.routes().length);
  readonly transportStops = computed(() =>
    this.transport.routeViews().reduce((count, route) => count + route.stops.length, 0));
  readonly todayMenu = this.cafeteria.todayMenu;
}
