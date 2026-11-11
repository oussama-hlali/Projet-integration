import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AnnouncementService } from '../../core/services/announcement.service';
import { AuthService } from '../../core/services/auth.service';
import { CampusEventService } from '../../core/services/campus-event.service';
import {
  BadgeVariant,
  BrandMarkComponent,
  EmptyStateComponent,
  ServiceLogoComponent,
  ServiceLogoName,
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

interface ServiceLink {
  label: string;
  hint: string;
  route: string;
  logo: ServiceLogoName;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    RouterLink,
    BrandMarkComponent,
    EmptyStateComponent,
    ServiceLogoComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  template: `
    <section class="page">
      <header class="hero glass glass--thick">
        <app-brand-mark size="lg" />
        <div class="hero__copy">
          <p class="eyebrow">
            <span class="eyebrow__dot" aria-hidden="true"></span>
            Live · Campus online
          </p>
          <h1>{{ greeting() }}, {{ firstName() }}</h1>
          <p class="hero__sub">Your campus at a glance · {{ today | date: 'EEEE d MMMM' }}</p>
        </div>
        <div class="hero__actions">
          <a class="hero__cta" routerLink="/lost-found">Open Lost &amp; Found</a>
        </div>
      </header>

      <div class="metrics">
        @for (metric of metrics(); track metric.label) {
          <app-stat-card [label]="metric.label" [value]="metric.value" [hint]="metric.hint" />
        }
      </div>

      <section class="services" aria-labelledby="services-title">
        <div class="services__head">
          <h2 id="services-title">Campus services</h2>
          <span class="services__count">{{ services.length }} destinations</span>
        </div>
        <div class="services__grid">
          @for (service of services; track service.route; let i = $index) {
            <a
              class="service glass"
              [routerLink]="service.route"
              [style.animation-delay]="i * 55 + 'ms'"
            >
              <app-service-logo [name]="service.logo" />
              <span class="service__text">
                <span class="service__label">{{ service.label }}</span>
                <span class="service__hint">{{ service.hint }}</span>
              </span>
            </a>
          }
        </div>
      </section>

      <div class="grid">
        <article class="panel glass glass--thick">
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

        <article class="panel glass glass--thick">
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

        <article class="panel glass glass--thick">
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

        <article class="panel glass glass--thick">
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
    .hero {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
      padding: var(--space-5) var(--space-6);
      overflow: hidden;
      border-radius: var(--radius-card);
      animation: hero-in 520ms var(--ease-out) both;
    }
    .hero::after {
      position: absolute;
      inset: 0;
      content: '';
      pointer-events: none;
      background:
        radial-gradient(62% 130% at 10% 0%, rgba(45, 212, 191, 0.24), transparent 62%),
        radial-gradient(55% 130% at 92% 110%, rgba(56, 189, 248, 0.2), transparent 66%);
    }
    .hero > * {
      position: relative;
      z-index: 1;
    }
    .hero__copy {
      min-width: 0;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.68rem;
      font-weight: var(--font-weight-semibold);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .eyebrow__dot {
      width: 8px;
      height: 8px;
      background: #14b8a6;
      border-radius: var(--radius-full);
      box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.5);
      animation: live-pulse 2.4s ease-out infinite;
    }
    .hero h1 {
      margin: 6px 0 4px;
      color: var(--color-text-strong);
      font-size: clamp(1.55rem, 2.6vw, 2.1rem);
      font-weight: var(--font-weight-semibold);
      line-height: var(--line-height-tight);
      letter-spacing: -0.02em;
    }
    .hero__sub {
      margin: 0;
      color: var(--color-text-muted);
    }
    .hero__actions {
      margin-left: auto;
    }
    .hero__cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 22px;
      color: #ffffff;
      font-weight: var(--font-weight-semibold);
      white-space: nowrap;
      text-decoration: none;
      background: linear-gradient(145deg, #14b8a6, #0e6ba8);
      border-radius: var(--radius-full);
      box-shadow: 0 14px 26px -16px rgba(13, 148, 136, 0.95);
      transition:
        transform var(--transition-base),
        box-shadow var(--transition-base);
    }
    .hero__cta:hover {
      color: #ffffff;
      text-decoration: none;
      transform: translateY(-2px);
      box-shadow: 0 18px 30px -16px rgba(13, 148, 136, 1);
    }
    .hero__cta:active {
      transform: translateY(0) scale(0.98);
    }
    .services {
      margin-bottom: var(--space-5);
    }
    .services__head {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2) var(--space-3);
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: var(--space-3);
    }
    .services__count {
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
    }
    .services__grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-3);
    }
    @media (min-width: 560px) {
      .services__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (min-width: 900px) {
      .services__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (min-width: 1240px) {
      .services__grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    .service {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      padding: 12px 14px;
      text-decoration: none;
      border-radius: var(--radius-tile);
      animation: service-in 520ms var(--ease-out) backwards;
      transition:
        transform var(--transition-base),
        box-shadow var(--transition-base);
    }
    .service:hover {
      text-decoration: none;
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
    }
    .service:active {
      transform: translateY(-1px) scale(0.99);
    }
    .service:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
    .service__text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .service__label {
      color: var(--color-text-strong);
      font-weight: var(--font-weight-semibold);
    }
    .service__hint {
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
    }
    @keyframes hero-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes service-in {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes live-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.5);
      }
      70%,
      100% {
        box-shadow: 0 0 0 9px rgba(20, 184, 166, 0);
      }
    }
    @media (max-width: 720px) {
      .hero {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        padding: var(--space-4);
      }
      .hero h1 {
        font-size: 1.5rem;
      }
      .hero__sub {
        font-size: var(--font-size-sm);
      }
      .hero__actions {
        grid-column: 1 / -1;
        width: 100%;
        margin-left: 0;
      }
      .hero__cta {
        width: 100%;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .hero,
      .service,
      .eyebrow__dot {
        animation: none;
      }
      .hero__cta,
      .service {
        transition: none;
      }
    }
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
      padding: var(--space-5);
      border-radius: var(--radius-card);
      transition:
        transform var(--transition-base),
        background-color var(--transition-base);
    }
    .panel:hover {
      transform: translateY(-2px);
    }
    h2 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: var(--font-weight-semibold);
      letter-spacing: -0.01em;
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
  private readonly auth = inject(AuthService);

  readonly today = new Date();

  readonly firstName = computed(
    () => this.auth.currentUser()?.fullName.trim().split(/\s+/)[0] ?? 'there',
  );

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  readonly services: readonly ServiceLink[] = [
    { label: 'Rooms', hint: 'Find a free seat', route: '/rooms', logo: 'rooms' },
    {
      label: 'Reservations',
      hint: 'Book a space',
      route: '/reservations',
      logo: 'reservations',
    },
    { label: 'Events', hint: 'What is on', route: '/events', logo: 'events' },
    {
      label: 'Announcements',
      hint: 'Campus news',
      route: '/announcements',
      logo: 'announcements',
    },
    { label: 'Transport', hint: 'Shuttle times', route: '/transport', logo: 'transport' },
    { label: 'Cafeteria', hint: "Today's menu", route: '/cafeteria', logo: 'cafeteria' },
    {
      label: 'Lost & Found',
      hint: 'Reunite with your things',
      route: '/lost-found',
      logo: 'lost-found',
    },
  ];

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