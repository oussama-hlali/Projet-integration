import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { EventInterest } from '../models/event-interest.model';

const STORAGE_KEY = 'smart-campus.event-interests';
const DEMO_USER_ID = 'u1';

/**
 * Stores which events a student follows.
 *
 * The Events page uses these marks both to render the "For you" rail and to
 * recommend upcoming events in the categories the student cares about.
 */
@Injectable({ providedIn: 'root' })
export class EventInterestService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private readonly state = signal<EventInterest[]>(this.load());

  constructor() {
    if (!environment.useMocks) {
      this.http.get<any[]>(`${this.cfg.apiBaseUrl()}/me/event-interests?userId=u1`).subscribe({
        next: (ids) => {
          // Convert ids to EventInterest objects
          const interests = (ids || []).map((id: string) => ({ eventId: id, userId: 'u1', createdAt: new Date() }));
          this.state.set(interests);
        },
        error: () => {},
      });
    }
  }

  readonly interests = this.state.asReadonly();

  isInterested(eventId: string, userId: string = DEMO_USER_ID): boolean {
    return this.state().some(
      (interest) => interest.eventId === eventId && interest.userId === userId,
    );
  }

  interestsFor(userId: string = DEMO_USER_ID): EventInterest[] {
    return this.state()
      .filter((interest) => interest.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Event ids the diner follows, newest mark first. */
  interestedEventIds(userId: string = DEMO_USER_ID): string[] {
    return this.interestsFor(userId).map((interest) => interest.eventId);
  }

  /** Toggle a mark and return the new state (`true` = now interested). */
  toggle(eventId: string, userId: string = DEMO_USER_ID): boolean {
    if (this.isInterested(eventId, userId)) {
      this.commit(
        this.state().filter(
          (interest) => !(interest.eventId === eventId && interest.userId === userId),
        ),
      );
      if (!environment.useMocks) {
        this.http.delete(`${this.cfg.apiBaseUrl()}/events/${eventId}/interest?userId=${userId}`).subscribe({ error: () => {} });
      }
      return false;
    }

    this.commit([{ eventId, userId, createdAt: new Date() }, ...this.state()]);
    if (!environment.useMocks) {
      this.http.put(`${this.cfg.apiBaseUrl()}/events/${eventId}/interest?userId=${userId}`, {}).subscribe({ error: () => {} });
    }
    return true;
  }

  private commit(interests: EventInterest[]): void {
    this.state.set(interests);
  }

  private load(): EventInterest[] {
    return [
      { eventId: 'e2', userId: DEMO_USER_ID, createdAt: new Date('2026-11-02T10:00:00') },
      { eventId: 'e6', userId: DEMO_USER_ID, createdAt: new Date('2026-11-04T14:30:00') },
      { eventId: 'e8', userId: DEMO_USER_ID, createdAt: new Date('2026-11-06T09:15:00') },
    ];
  }
}
