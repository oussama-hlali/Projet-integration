import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_CATEGORY_LABELS,
  AnnouncementCategory,
} from '../../core/models/announcement.model';
import { AnnouncementService } from '../../core/services/announcement.service';
import { FeedComponent, PageHeaderComponent, StatCardComponent } from '../../shared/components';

type CategoryFilter = 'all' | AnnouncementCategory;

/**
 * PB-12 — Announcements.
 *
 * Students read campus notices, narrow them by category or search term and
 * keep track of what they have already seen. Data comes from the same
 * `AnnouncementService` the dashboard uses, so both pages stay in sync.
 */
@Component({
  selector: 'app-announcements',
  imports: [FeedComponent, PageHeaderComponent, StatCardComponent],
  templateUrl: './announcements.html',
  styleUrl: './announcements.scss',
})
export class Announcements {
  private readonly announcementService = inject(AnnouncementService);

  readonly announcements = toSignal(this.announcementService.getAnnouncements(), {
    requireSync: true,
  });

  readonly categories = ANNOUNCEMENT_CATEGORIES;
  readonly categoryLabels = ANNOUNCEMENT_CATEGORY_LABELS;

  readonly categoryFilter = signal<CategoryFilter>('all');
  readonly search = signal('');
  readonly unreadOnly = signal(false);

  /** Read state is local to this demo page; nothing is persisted server-side. */
  readonly readIds = signal<ReadonlySet<string>>(new Set());

  readonly pinnedCount = computed(
    () => this.announcements().filter((announcement) => announcement.pinned).length,
  );

  readonly unreadCount = computed(
    () => this.announcements().filter((announcement) => !this.isRead(announcement.id)).length,
  );

  readonly metrics = computed(() => [
    {
      label: 'Published',
      value: this.announcements().length,
      hint: 'Campus notices',
    },
    {
      label: 'Pinned',
      value: this.pinnedCount(),
      hint: 'Important notices',
    },
    {
      label: 'Unread',
      value: this.unreadCount(),
      hint: 'Still to review',
    },
  ]);

  readonly counts = computed<Record<CategoryFilter, number>>(() => {
    const counts: Record<CategoryFilter, number> = {
      all: 0,
      GENERAL: 0,
      ACADEMIC: 0,
      ADMINISTRATIVE: 0,
      EVENTS: 0,
      MAINTENANCE: 0,
    };

    for (const announcement of this.announcements()) {
      counts.all += 1;
      counts[announcement.category] += 1;
    }

    return counts;
  });

  readonly filtered = computed(() => {
    const category = this.categoryFilter();
    const term = this.search().trim().toLowerCase();
    const unreadOnly = this.unreadOnly();

    return this.announcements()
      .filter(
        (announcement) =>
          (category === 'all' || announcement.category === category) &&
          (!unreadOnly || !this.isRead(announcement.id)) &&
          (!term ||
            `${announcement.title} ${announcement.content}`.toLowerCase().includes(term)),
      )
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          b.publishedAt.getTime() - a.publishedAt.getTime(),
      );
  });

  readonly hasFilters = computed(
    () => this.categoryFilter() !== 'all' || !!this.search().trim() || this.unreadOnly(),
  );

  setCategory(category: CategoryFilter): void {
    this.categoryFilter.set(category);
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  toggleUnreadOnly(): void {
    this.unreadOnly.update((value) => !value);
  }

  toggleRead(id: string): void {
    this.readIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  markAllRead(): void {
    this.readIds.set(new Set(this.announcements().map((announcement) => announcement.id)));
  }

  resetFilters(): void {
    this.categoryFilter.set('all');
    this.search.set('');
    this.unreadOnly.set(false);
  }

  isRead(id: string): boolean {
    return this.readIds().has(id);
  }
}
