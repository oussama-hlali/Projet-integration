import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { EventInterest } from '../models/event-interest.model';

const DEMO_USER_ID = 'u1';

/**
 * Stores which events a student follows.
 *
 * The Events page uses these marks both to render the "For you" rail and to
 * recommend upcoming events in the categories the student cares about. Live
 * mode reads/writes the engagement service; mock mode keeps demo marks.
 */
@Injectable({ providedIn: 'root' })
export class EventInterestService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private readonly state = signal<EventInterest[]>(environment.useMocks ? this.load() : []);

  constructor() {
    if (!environment.useMocks) {
      this.refresh(DEMO_USER_ID);
    }
  }

  private apiBase(): string {
    return this.cfg.apiBaseUrl();
  }

  private refresh(userId: string): void {
    this.http.get<any[]>(`${this.apiBase()}/me/event-interests?userId=${userId}`).subscribe({
      next: (ids) => this.state.set(
        (ids ?? []).map((id) => ({
          eventId: String(id),
          userId,
          createdAt: new Date(),
        })),
      ),
      error: () => {},
    });
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
    const before = this.state();
    if (this.isInterested(eventId, userId)) {
      this.commit(
        before.filter(
          (interest) => !(interest.eventId === eventId && interest.userId === userId),
        ),
      );
      if (!environment.useMocks) {
        this.http.delete(`${this.apiBase()}/events/${eventId}/interest?userId=${userId}`).subscribe({
          next: () => this.refresh(userId),
          error: () => this.commit(before),
        });
      }
      return false;
    }

    this.commit([{ eventId, userId, createdAt: new Date() }, ...before]);
    if (!environment.useMocks) {
      this.http.put(`${this.apiBase()}/events/${eventId}/interest?userId=${userId}`, {}).subscribe({
        next: () => this.refresh(userId),
        error: () => this.commit(before),
      });
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
