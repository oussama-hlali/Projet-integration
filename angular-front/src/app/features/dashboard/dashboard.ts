import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AnnouncementService } from '../../core/services/announcement.service';
import { CampusEventService } from '../../core/services/campus-event.service';
import {
  BadgeVariant,
  EmptyStateComponent,
  PageHeaderComponent,
  StatCardComponent,
  StatusBadgeComponent,
} from '../../shared/components';

interface ScheduleItem {
  time: string;
  title: string;
  room: string;
}

type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

interface RoomHighlight {
  name: string;
  building: string;
  capacity: number;
  status: RoomStatus;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    RouterLink,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  template: `
    <section class="page">
      <app-page-header title="Dashboard" subtitle="Your campus at a glance" />

      <div class="metrics">
        @for (metric of metrics(); track metric.label) {
          <app-stat-card [label]="metric.label" [value]="metric.value" [hint]="metric.hint" />
        }
      </div>

      <div class="grid">
        <article class="panel">
          <h2>Today's schedule</h2>
          @for (item of schedule; track item.time) {
            <div class="row">
              <strong class="row__time">{{ item.time }}</strong>
              <span class="row__title">{{ item.title }}</span>
              <small class="row__meta">{{ item.room }}</small>
            </div>
          } @empty {
            <app-empty-state title="No classes today" />
          }
        </article>

        <article class="panel">
          <h2>Upcoming events</h2>
          @for (event of upcomingEvents(); track event.id) {
            <div class="row">
              <strong class="row__time">{{ event.date | date: 'dd/MM HH:mm' }}</strong>
              <span class="row__title">{{ event.title }}</span>
              <small class="row__meta">{{ event.location }}</small>
            </div>
          } @empty {
            <app-empty-state title="No upcoming events" />
          }
          <a class="link" routerLink="/events">See all events</a>
        </article>

        <article class="panel">
          <h2>Announcements</h2>
          @for (announcement of latestAnnouncements(); track announcement.id) {
            <div class="row">
              <app-status-badge
                [label]="announcement.category"
                [variant]="announcement.pinned ? 'info' : 'neutral'"
              />
              <span class="row__title">{{ announcement.title }}</span>
              <small class="row__meta">{{ announcement.publishedAt | date: 'dd/MM/yyyy' }}</small>
            </div>
          } @empty {
            <app-empty-state title="No announcements" />
          }
          <a class="link" routerLink="/announcements">See all announcements</a>
        </article>

        <article class="panel">
          <h2>Room highlights</h2>
          @for (room of rooms; track room.name) {
            <div class="row">
              <strong class="row__time">{{ room.name }}</strong>
              <span class="row__title">{{ room.building }} · {{ room.capacity }} seats</span>
              <app-status-badge [label]="room.status" [variant]="roomVariant(room.status)" />
            </div>
          }
          <a class="link" routerLink="/rooms">See all rooms</a>
        </article>
      </div>
    </section>
  `,
  styles: `
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-5);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-4);
    }
    .panel {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      background-color: var(--glass-bg-strong);
      background-image: linear-gradient(180deg, var(--glass-highlight), transparent 30%);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--glass-shadow);
      backdrop-filter: blur(18px) saturate(140%);
      -webkit-backdrop-filter: blur(18px) saturate(140%);
      transition:
        border-color var(--transition-fast),
        background-color var(--transition-base);
    }
    .panel:hover {
      border-color: color-mix(in srgb, var(--color-accent) 28%, var(--glass-border));
    }
    h2 {
      margin: 0;
      font-size: var(--font-size-lg);
      color: var(--color-text-strong);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2) var(--space-3);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-border);
    }
    .row:last-of-type {
      border-bottom: 0;
    }
    .row__time {
      color: var(--color-text-strong);
      font-weight: var(--font-weight-semibold);
    }
    .row__title {
      color: var(--color-text);
    }
    .row__meta {
      margin-left: auto;
      color: var(--color-text-muted);
    }
    .link {
      margin-top: auto;
      color: var(--color-accent);
      font-weight: var(--font-weight-medium);
      text-decoration: none;
    }
    .link:hover {
      color: var(--color-accent-hover);
      text-decoration: underline;
    }
  `,
})
export class Dashboard {
  private readonly eventService = inject(CampusEventService);
  private readonly announcementService = inject(AnnouncementService);

  readonly events = toSignal(this.eventService.getEvents(), { requireSync: true });
  readonly announcements = toSignal(this.announcementService.getAnnouncements(), {
    requireSync: true,
  });

  readonly schedule: ScheduleItem[] = [
    { time: '08:30', title: 'Architecture SOA', room: 'Salle 12' },
    { time: '10:15', title: 'Développement mobile', room: 'Labo info 2' },
    { time: '14:00', title: 'Méthodologies agiles', room: 'Amphi A' },
  ];

  readonly rooms: RoomHighlight[] = [
    { name: 'Salle 12', building: 'Bloc A', capacity: 40, status: 'AVAILABLE' },
    { name: 'Labo info 2', building: 'Bloc B', capacity: 25, status: 'OCCUPIED' },
    { name: 'Amphi A', building: 'Bloc C', capacity: 200, status: 'RESERVED' },
  ];

  readonly upcomingEvents = computed(() =>
    this.events()
      .filter((event) => event.date >= new Date())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3),
  );

  readonly latestAnnouncements = computed(() =>
    [...this.announcements()]
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          b.publishedAt.getTime() - a.publishedAt.getTime(),
      )
      .slice(0, 3),
  );

  readonly metrics = computed(() => [
    { label: 'Upcoming events', value: this.upcomingEvents().length, hint: 'Next 3 on campus' },
    { label: 'Announcements', value: this.announcements().length, hint: 'Published' },
    {
      label: 'Pinned',
      value: this.announcements().filter((a) => a.pinned).length,
      hint: 'Important notices',
    },
    { label: 'Classes today', value: this.schedule.length, hint: 'On your schedule' },
    {
      label: 'Free rooms',
      value: this.rooms.filter((r) => r.status === 'AVAILABLE').length,
      hint: 'Available now',
    },
  ]);

  roomVariant(status: RoomStatus): BadgeVariant {
    if (status === 'AVAILABLE') return 'success';
    if (status === 'OCCUPIED') return 'danger';
    return 'warning';
  }
}