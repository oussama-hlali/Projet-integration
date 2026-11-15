import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  CampusEvent,
  EVENT_CATEGORIES,
  EventCategory,
} from '../../core/models/campus-event.model';
import { AuthService } from '../../core/services/auth.service';
import { CampusEventService } from '../../core/services/campus-event.service';
import { EventInterestService } from '../../core/services/event-interest.service';
import { ToastService } from '../../core/services/toast.service';
import {
  EmptyStateComponent,
  ServiceLogoComponent,
  StatusBadgeComponent,
} from '../../shared/components';
import { categoryLabel, categoryVariant, isPastEvent } from './event-meta';

type CategoryFilter = 'all' | 'interested' | EventCategory;

type DateFilter = 'any' | 'next-7' | 'next-30' | 'past';

interface DateOption {
  value: DateFilter;
  label: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const FOR_YOU_LIMIT = 6;

/**
 * PB-10 — Events.
 *
 * Students follow the events they care about and get a short "For you" rail
 * built from their interests and the categories they mark. The full calendar
 * still supports category and date filters, with past events archived at the
 * bottom of the list.
 */
@Component({
  selector: 'app-events',
  imports: [DatePipe, RouterLink, EmptyStateComponent, ServiceLogoComponent, StatusBadgeComponent],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events {
  private readonly eventService = inject(CampusEventService);
  private readonly interestService = inject(EventInterestService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly now = new Date();

  readonly events = toSignal(this.eventService.getEvents(), { requireSync: true });
  readonly categories = EVENT_CATEGORIES;

  readonly categoryFilter = signal<CategoryFilter>('all');
  readonly dateFilter = signal<DateFilter>('any');

  readonly dateOptions: readonly DateOption[] = [
    { value: 'any', label: 'Any date' },
    { value: 'next-7', label: 'Next 7 days' },
    { value: 'next-30', label: 'Next 30 days' },
    { value: 'past', label: 'Past events' },
  ];

  readonly categoryLabel = categoryLabel;
  readonly categoryVariant = categoryVariant;

  readonly counts = computed<Record<CategoryFilter, number>>(() => {
    const counts: Record<CategoryFilter, number> = {
      all: 0,
      interested: 0,
      ACADEMIC: 0,
      SOCIAL: 0,
      SPORT: 0,
      CULTURE: 0,
      CAREER: 0,
    };

    for (const event of this.events()) {
      counts.all += 1;
      counts[event.category] += 1;
      if (this.isInterested(event)) {
        counts.interested += 1;
      }
    }

    return counts;
  });

  readonly interestedEvents = computed(() =>
    this.events()
      .filter((event) => this.isInterested(event))
      .sort((a, b) => this.compare(a, b)),
  );

  readonly upcomingCount = computed(
    () => this.events().filter((event) => !isPastEvent(event, this.now)).length,
  );

  /**
   * Upcoming events the student follows, plus upcoming events from the
   * categories those marks belong to.
   */
  readonly forYou = computed(() => {
    const markedIds = new Set(this.interestedEvents().map((event) => event.id));
    const followedCategories = new Set(
      this.interestedEvents().map((event) => event.category),
    );

    return this.events()
      .filter((event) => !isPastEvent(event, this.now))
      .filter(
        (event) => markedIds.has(event.id) || followedCategories.has(event.category),
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, FOR_YOU_LIMIT);
  });

  /** Soonest upcoming event across the whole calendar, ignoring the filters. */
  readonly nextEvent = computed(() =>
    this.events()
      .filter((event) => !isPastEvent(event, this.now))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .at(0),
  );

  readonly filtered = computed(() => {
    const category = this.categoryFilter();
    const window = this.dateFilter();

    return this.events()
      .filter(
        (event) =>
          (category === 'all' ||
            (category === 'interested' && this.isInterested(event)) ||
            event.category === category) &&
          this.matchesWindow(event, window),
      )
      .sort((a, b) => this.compare(a, b));
  });

  readonly hasFilters = computed(
    () =>
      this.categoryFilter() !== 'all' ||
      this.dateFilter() !== 'any',
  );

  setCategory(category: CategoryFilter): void {
    this.categoryFilter.set(category);
  }

  setDate(event: Event): void {
    this.dateFilter.set((event.target as HTMLSelectElement).value as DateFilter);
  }

  resetFilters(): void {
    this.categoryFilter.set('all');
    this.dateFilter.set('any');
  }

  isPast(event: CampusEvent): boolean {
    return isPastEvent(event, this.now);
  }

  isInterested(event: CampusEvent): boolean {
    return this.interestService.isInterested(event.id, this.currentUserId());
  }

  toggleInterest(event: CampusEvent): void {
    const interested = this.interestService.toggle(event.id, this.currentUserId());
    this.toast.info(
      interested ? 'Following event' : 'Stopped following event',
      event.title,
    );
  }

  /** Human-readable reason a card was picked for the "For you" rail. */
  forYouReason(event: CampusEvent): string {
    return this.isInterested(event)
      ? 'You follow this event'
      : `Because you follow ${categoryLabel(event.category)}`;
  }

  private currentUserId(): string {
    return this.auth.currentUser()?.id ?? 'u1';
  }

  private matchesWindow(event: CampusEvent, window: DateFilter): boolean {
    if (window === 'any') {
      return true;
    }

    if (window === 'past') {
      return isPastEvent(event, this.now);
    }

    if (isPastEvent(event, this.now)) {
      return false;
    }

    const horizon = this.now.getTime() + (window === 'next-7' ? 7 : 30) * DAY_MS;
    return event.date.getTime() <= horizon;
  }

  /** Upcoming first (soonest on top), then past events (most recent first). */
  private compare(a: CampusEvent, b: CampusEvent): number {
    const pastA = isPastEvent(a, this.now);
    const pastB = isPastEvent(b, this.now);

    if (pastA !== pastB) {
      return pastA ? 1 : -1;
    }

    return pastA ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime();
  }
}
