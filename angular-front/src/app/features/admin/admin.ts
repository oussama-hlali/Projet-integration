import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NOTIFICATION_TYPE_LABELS, Notification } from '../../core/models/notification.model';
import { RESERVATION_STATUS_LABELS, Reservation } from '../../core/models/reservation.model';
import { notificationRoute } from '../../core/notification-route';
import { AdminService } from '../../core/services/admin.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import {
  BadgeVariant,
  EmptyStateComponent,
  PageHeaderComponent,
  StatCardComponent,
  StatusBadgeComponent,
} from '../../shared/components';
import { KpiChartComponent, KpiChartItem } from './kpi-chart.component';

const RESERVATION_VARIANTS: Record<Reservation['status'], BadgeVariant> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'neutral',
};

interface QuickLink {
  label: string;
  hint: string;
  route: string;
}

/**
 * Administrator overview.
 *
 * The KPI strip comes from `AnalyticsService`; the approval queue and the
 * activity feed are cross-domain read models exposed by `AdminService`.
 * Approving or declining a booking here goes through the same rules as the
 * reservations management screen.
 */
@Component({
  selector: 'app-admin',
  imports: [
    DatePipe,
    RouterLink,
    EmptyStateComponent,
    KpiChartComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  private readonly analytics = inject(AnalyticsService);
  protected readonly admin = inject(AdminService);

  protected readonly notificationLabels = NOTIFICATION_TYPE_LABELS;

  protected readonly feedback = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly metrics = computed(() => [
    {
      label: 'Pending approvals',
      value: this.analytics.pendingReservations(),
      hint: 'Reservations awaiting review',
    },
    {
      label: 'Occupancy',
      value: this.percent(this.analytics.occupancyRate()),
      hint: 'Occupied + reserved rooms',
    },
    {
      label: 'Upcoming events',
      value: this.analytics.upcomingEvents(),
      hint: 'Still ahead on the calendar',
    },
    {
      label: 'Open reports',
      value: this.analytics.openLostFound(),
      hint: 'Unclaimed lost & found items',
    },
    {
      label: 'Users',
      value: this.analytics.usersTotal(),
      hint: `${this.analytics.studentsCount()} students`,
    },
    {
      label: 'Rooms',
      value: this.analytics.roomsTotal(),
      hint: `${this.analytics.roomsAvailable()} available`,
    },
  ]);

  protected readonly quickLinks: readonly QuickLink[] = [
    { label: 'Manage rooms', hint: 'Catalogue and status', route: '/admin/rooms' },
    { label: 'Publish event', hint: 'Calendar and capacity', route: '/admin/events' },
    { label: 'New announcement', hint: 'Broadcast to campus', route: '/admin/announcements' },
    { label: 'Review bookings', hint: 'Approve or decline', route: '/admin/reservations' },
    { label: 'Lost & Found', hint: 'Claim or remove reports', route: '/admin/lost-found' },
    { label: 'Manage users', hint: 'Accounts and roles', route: '/admin/users' },
  ];

  protected readonly pending = this.admin.pendingReservations;
  protected readonly activity = this.admin.recentActivity;

  protected readonly roomChart = computed<KpiChartItem[]>(() => [
    { label: 'Available', value: this.analytics.roomsAvailable(), variant: 'success' },
    { label: 'Occupied', value: this.analytics.roomsOccupied(), variant: 'info' },
    { label: 'Reserved', value: this.analytics.roomsReserved(), variant: 'warning' },
    { label: 'Maintenance', value: this.analytics.roomsMaintenance(), variant: 'danger' },
  ]);

  protected readonly reservationChart = computed<KpiChartItem[]>(() => [
    { label: 'Pending', value: this.analytics.pendingReservations(), variant: 'warning' },
    { label: 'Confirmed', value: this.analytics.confirmedReservations(), variant: 'success' },
    { label: 'Completed', value: this.analytics.completedReservations(), variant: 'neutral' },
    { label: 'Cancelled', value: this.analytics.cancelledReservations(), variant: 'danger' },
  ]);

  protected activityRoute(item: Notification): string {
    return notificationRoute(item, 'admin');
  }

  protected percent(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  protected statusLabel(reservation: Reservation): string {
    return RESERVATION_STATUS_LABELS[reservation.status];
  }

  protected statusVariant(reservation: Reservation): BadgeVariant {
    return RESERVATION_VARIANTS[reservation.status];
  }

  protected approve(reservation: Reservation): void {
    this.error.set(null);
    const approved = this.admin.approveReservation(reservation.id);
    if (approved) {
      this.feedback.set(`Booking for ${approved.room} was approved.`);
    } else {
      this.error.set('That booking is no longer pending.');
    }
  }

  protected decline(reservation: Reservation): void {
    this.error.set(null);
    const cancelled = this.admin.cancelReservation(reservation.id);
    if (cancelled) {
      this.feedback.set(`Booking for ${cancelled.room} was declined.`);
    } else {
      this.error.set('That booking could not be declined.');
    }
  }

  protected dismissFeedback(): void {
    this.feedback.set(null);
  }

  protected dismissError(): void {
    this.error.set(null);
  }
}
