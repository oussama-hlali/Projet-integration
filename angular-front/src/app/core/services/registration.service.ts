import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { EventRegistration } from '../models/event-registration.model';
import { CampusEventService } from './campus-event.service';
import { mapEventRegistration } from './live-mappers';
import { NotificationService } from './notification.service';

const DEMO_USER_ID = 'u1';

/**
 * Event registration store, aligned with the `EventRegistration` class and
 * the `CampusEvent "1" -- "0..*" EventRegistration` association.
 *
 * A registration owns the QR code shown on the event detail page, so
 * registering immediately reveals the code and unregistering removes it.
 * Live mode persists through the engagement service; mock mode uses seeds.
 */
@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly events = inject(CampusEventService);
  private readonly notifications = inject(NotificationService);
  private readonly http = inject(HttpClient, { optional: true });
  private readonly cfg = inject(RuntimeConfigService, { optional: true });
  private readonly state = signal<EventRegistration[]>(environment.useMocks ? this.load() : []);
  private readonly loadedEventIds = new Set<string>();

  constructor() {
    if (!environment.useMocks) {
      // Events arrive asynchronously; check each event's registration once it
      // appears so a page refresh can show the QR code again.
      effect(() => {
        for (const event of this.events.events()) {
          if (this.loadedEventIds.has(event.id)) continue;
          this.loadedEventIds.add(event.id);
          this.http!.get<any>(`${this.apiBase()}/events/${event.id}/registrations/me?userId=${DEMO_USER_ID}`).subscribe({
            next: (row) => {
              if (!row?.registered) return;
              const mapped = mapEventRegistration(row, event.id, DEMO_USER_ID);
              // `/registrations/me` only returns the QR code; give the local row
              // a stable id so a later registration cannot duplicate it.
              this.commit([
                { ...mapped, id: mapped.id || `reg_${event.id}_${DEMO_USER_ID}` },
                ...this.state().filter((candidate) => candidate.eventId !== event.id),
              ]);
            },
            error: () => {},
          });
        }
      });
    }
  }

  private apiBase(): string {
    return this.cfg!.apiBaseUrl();
  }

  canRegister(eventId: string, userId: string = DEMO_USER_ID): boolean {
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
    const notify = (): void => {
      const event = this.events.findById(eventId);
      this.notifications.add({
        message: `Votre inscription à « ${event?.title ?? 'l\u2019événement'} » est enregistrée. Votre QR code est prêt.`,
        type: 'EVENT',
        eventId,
      });
    };

    if (!environment.useMocks) {
      this.http!.post<any>(`${this.apiBase()}/events/${eventId}/registrations?userId=${userId}`, {}).subscribe({
        next: (row) => {
          this.replace(registration.id, mapEventRegistration(row, eventId, userId));
          notify();
        },
        error: () =>
          this.commit(this.state().filter((candidate) => candidate.id !== registration.id)),
      });
    } else {
      notify();
    }
    return registration;
  }

  unregister(eventId: string, userId: string = DEMO_USER_ID): boolean {
    const before = this.state();
    const target = before.find(
      (registration) => registration.eventId === eventId && registration.userId === userId,
    );
    if (!target) {
      return false;
    }

    this.commit(
      before.filter(
        (registration) => !(registration.eventId === eventId && registration.userId === userId),
      ),
    );
    if (!environment.useMocks) {
      this.http!.delete(`${this.apiBase()}/events/${eventId}/registrations/me?userId=${userId}`).subscribe({
        error: () => this.commit(before),
      });
    }
    return true;
  }

  private replace(id: string, registration: EventRegistration): void {
    this.commit(
      this.state().map((candidate) => (candidate.id === id ? registration : candidate)),
    );
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
