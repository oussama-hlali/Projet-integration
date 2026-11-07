import { Injectable, signal } from '@angular/core';
import { EventRegistration } from '../models/event-registration.model';

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
  private readonly state = signal<EventRegistration[]>(this.load());

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
    return true;
  }

  private commit(registrations: EventRegistration[]): void {
    this.state.set(registrations);
    this.persist(registrations);
  }

  private load(): EventRegistration[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed
              .filter(
                (entry): entry is Record<string, unknown> =>
                  !!entry &&
                  typeof entry === 'object' &&
                  typeof (entry as EventRegistration).id === 'string' &&
                  typeof (entry as EventRegistration).eventId === 'string',
              )
              .map((entry) => ({
                id: String(entry['id']),
                registeredAt: new Date(String(entry['registeredAt'])),
                qrCode: String(entry['qrCode']),
                userId: String(entry['userId']),
                eventId: String(entry['eventId']),
              }));
          }
        }
      } catch {
        // Fall through to the seeded registration.
      }
    }

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

  private persist(registrations: EventRegistration[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          registrations.map((registration) => ({
            ...registration,
            registeredAt: registration.registeredAt.toISOString(),
          })),
        ),
      );
    } catch {
      // Storage can be full or blocked; the in-memory store still works.
    }
  }
}
