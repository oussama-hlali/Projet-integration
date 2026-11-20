import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { Notification, NotificationType } from '../models/notification.model';

const STORAGE_KEY = 'smart-campus.notifications';
const DEMO_USER_ID = 'u1';

/**
 * Notification store. Each notification may reference the announcement,
 * event, reservation or lost & found item it is about, matching the diagram's
 * `0..*` associations.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly cfg = inject(RuntimeConfigService, { optional: true });
  private readonly state = signal<Notification[]>(this.load());

  constructor() {
    if (!environment.useMocks) {
      this.http!.get<any[]>(`${this.cfg!.apiBaseUrl()}/notifications?userId=u1`).subscribe({
        next: (rows) => this.state.set(rows as Notification[]),
        error: () => {},
      });
    }
  }

  readonly notifications = this.state.asReadonly();

  readonly unreadCount = computed(
    () => this.state().filter((notification) => !notification.read).length,
  );

  markAsRead(id: string): Notification | undefined {
    return this.patch(id, { read: true });
  }

  markAsUnread(id: string): Notification | undefined {
    return this.patch(id, { read: false });
  }

  toggleRead(id: string): Notification | undefined {
    const target = this.state().find((notification) => notification.id === id);
    return target ? this.patch(id, { read: !target.read }) : undefined;
  }

  markAllRead(): void {
    this.commit(this.state().map((notification) => ({ ...notification, read: true })));
    if (!environment.useMocks) {
      this.http!.post(`${this.cfg!.apiBaseUrl()}/notifications/read-all?userId=u1`, {}).subscribe({ error: () => {} });
    }
  }

  remove(id: string): boolean {
    if (!this.state().some((notification) => notification.id === id)) {
      return false;
    }

    this.commit(this.state().filter((notification) => notification.id !== id));
    if (!environment.useMocks) {
      this.http!.delete(`${this.cfg!.apiBaseUrl()}/notifications/${id}`).subscribe({ error: () => {} });
    }
    return true;
  }

  add(input: {
    message: string;
    type: NotificationType;
    userId?: string;
    announcementId?: string;
    eventId?: string;
    reservationId?: string;
    lostFoundId?: string;
  }): Notification {
    const notification: Notification = {
      id: `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      message: input.message,
      type: input.type,
      createdAt: new Date(),
      read: false,
      userId: input.userId ?? DEMO_USER_ID,
      announcementId: input.announcementId,
      eventId: input.eventId,
      reservationId: input.reservationId,
      lostFoundId: input.lostFoundId,
    };

    this.commit([notification, ...this.state()]);
    return notification;
  }

  private patch(id: string, changes: Partial<Notification>): Notification | undefined {
    const target = this.state().find((notification) => notification.id === id);
    if (!target) {
      return undefined;
    }

    const updated: Notification = { ...target, ...changes, id };
    this.commit(this.state().map((notification) => (notification.id === id ? updated : notification)));
    if (!environment.useMocks) {
      this.http!.patch(`${this.cfg!.apiBaseUrl()}/notifications/${id}`, { read: changes.read }).subscribe({ error: () => {} });
    }
    return updated;
  }

  private commit(notifications: Notification[]): void {
    this.state.set(notifications);
  }

  private load(): Notification[] {
    return this.seed();
  }

  private seed(): Notification[] {
    return [
      {
        id: 'n1',
        message: 'La rentrée universitaire approche : consultez les nouvelles annonces.',
        createdAt: new Date('2026-11-06T08:30:00'),
        read: false,
        userId: DEMO_USER_ID,
        type: 'ANNOUNCEMENT',
        announcementId: 'a1',
      },
      {
        id: 'n2',
        message: 'Votre réservation pour Innovation Lab est confirmée.',
        createdAt: new Date('2026-11-05T17:10:00'),
        read: false,
        userId: DEMO_USER_ID,
        type: 'RESERVATION',
        reservationId: 'seed-1',
      },
      {
        id: 'n3',
        message: 'Votre inscription au Forum des stages est enregistrée. Votre QR code est prêt.',
        createdAt: new Date('2026-11-04T12:00:00'),
        read: false,
        userId: DEMO_USER_ID,
        type: 'EVENT',
        eventId: 'e6',
      },
      {
        id: 'n4',
        message: 'Le menu de la cafétéria vient d’être mis à jour.',
        createdAt: new Date('2026-11-03T07:45:00'),
        read: true,
        userId: DEMO_USER_ID,
        type: 'SYSTEM',
        actionUrl: '/cafeteria',
      },
      {
        id: 'n5',
        message: 'Un objet trouvé correspond peut-être à votre carte étudiante.',
        createdAt: new Date('2026-11-02T15:20:00'),
        read: true,
        userId: DEMO_USER_ID,
        type: 'LOST_FOUND',
        lostFoundId: 'lf-2',
      },
    ];
  }
}
