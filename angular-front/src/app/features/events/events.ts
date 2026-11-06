import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  CampusEvent,
  EVENT_CATEGORIES,
  EventCategory,
} from '../../core/models/campus-event.model';
import { CampusEventService } from '../../core/services/campus-event.service';
import {
  EmptyStateComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
} from '../../shared/components';
import { categoryLabel, categoryVariant, isPastEvent } from './event-meta';

type CategoryFilter = 'all' | EventCategory;

type DateFilter = 'any' | 'next-7' | 'next-30' | 'past';

interface DateOption {
  value: DateFilter;
  label: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * PB-10 — Events.
 *
 * Students browse the campus calendar, narrow it by category or date window
 * and open an event for the full details. Past events stay in the list so the
 * archive is browsable, but upcoming events always come first.
 */
@Component({
  selector: 'app-events',
  imports: [DatePipe, RouterLink, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events {
  private readonly eventService = inject(CampusEventService);
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
      ACADEMIC: 0,
      SOCIAL: 0,
      SPORT: 0,
      CULTURE: 0,
      CAREER: 0,
    };

    for (const event of this.events()) {
      counts.all += 1;
      counts[event.category] += 1;
    }

    return counts;
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
          (category === 'all' || event.category === category) &&
          this.matchesWindow(event, window),
      )
      .sort((a, b) => this.compare(a, b));
  });

  readonly hasFilters = computed(
    () => this.categoryFilter() !== 'all' || this.dateFilter() !== 'any',
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
