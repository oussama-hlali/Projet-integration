import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { EventRegistration } from '../models/event-registration.model';
import { CampusEventService } from './campus-event.service';
import { NotificationService } from './notification.service';

const STORAGE_KEY = 'smart-campus.event-registrations';
const DEMO_USER_ID = 'u1';

/**
 * Event registration store, aligned with the `EventRegistration` class and
 * the `CampusEvent "1" -- "0..*" EventRegistration` association.
 *
 * A registration owns the QR code shown on the event detail page, so
 * registering immediately reveals the code and unregistering removes it.
 */
@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly events = inject(CampusEventService);
  private readonly notifications = inject(NotificationService);
  private readonly http = inject(HttpClient, { optional: true });
  private readonly cfg = inject(RuntimeConfigService, { optional: true });
  private readonly state = signal<EventRegistration[]>(this.load());

  constructor() {
    if (!environment.useMocks) {
      // Load registrations from backend (best-effort, per user)
      this.http?.get<any[]>(`${this.cfg?.apiBaseUrl()}/events`).subscribe({
        next: () => {},
        error: () => {},
      });
    }
  }

  canRegister(eventId: string, userId: string = 'u1'): boolean {
    if (this.isRegistered(eventId, userId)) {
      return false;
    }

    const event = this.events.findById(eventId);
    if (!event) {
      return false;
    }

    return this.countFor(eventId) < event.capacity;
  }

  readonly registrations = this.state.asReadonly();

  isRegistered(eventId: string, userId: string = DEMO_USER_ID): boolean {
    return this.state().some(
      (registration) => registration.eventId === eventId && registration.userId === userId,
    );
  }

  findForEvent(eventId: string, userId: string = DEMO_USER_ID): EventRegistration | undefined {
    return this.state().find(
      (registration) => registration.eventId === eventId && registration.userId === userId,
    );
  }

  countFor(eventId: string): number {
    return this.state().filter((registration) => registration.eventId === eventId).length;
  }

  register(eventId: string, userId: string = DEMO_USER_ID): EventRegistration {
    const existing = this.findForEvent(eventId, userId);
    if (existing) {
      return existing;
    }

    const registration: EventRegistration = {
      id: `reg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      registeredAt: new Date(),
      qrCode: `SC-${eventId.toUpperCase()}-${userId.toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`,
      userId,
      eventId,
    };

    this.commit([...this.state(), registration]);
    if (!environment.useMocks) {
      this.http!.post(`${this.cfg!.apiBaseUrl()}/events/${eventId}/registrations?userId=${userId}`, {}).subscribe({ error: () => {} });
    }
    const event = this.events.findById(eventId);
    this.notifications.add({
      message: `Votre inscription à « ${event?.title ?? 'l\u2019événement'} » est enregistrée. Votre QR code est prêt.`,
      type: 'EVENT',
      eventId,
    });
    return registration;
  }

  unregister(eventId: string, userId: string = DEMO_USER_ID): boolean {
    if (!this.isRegistered(eventId, userId)) {
      return false;
    }

    this.commit(
      this.state().filter(
        (registration) => !(registration.eventId === eventId && registration.userId === userId),
      ),
    );
    if (!environment.useMocks) {
      this.http!.delete(`${this.cfg!.apiBaseUrl()}/events/${eventId}/registrations/me?userId=${userId}`).subscribe({ error: () => {} });
    }
    return true;
  }

  private commit(registrations: EventRegistration[]): void {
    this.state.set(registrations);
  }

  private load(): EventRegistration[] {
    return [
      {
        id: 'reg-seed-1',
        registeredAt: new Date('2026-11-01T09:00:00'),
        qrCode: 'SC-E6-U1-K7M2QP',
        userId: DEMO_USER_ID,
        eventId: 'e6',
      },
    ];
  }

}
