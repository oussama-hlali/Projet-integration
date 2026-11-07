import { Component, computed, inject, signal } from '@angular/core';
import {
  LOST_FOUND_STATUSES,
  LOST_FOUND_STATUS_LABELS,
  LostFoundItem,
  LostFoundReportInput,
  LostFoundStatus,
} from '../../core/models/lost-found.model';
import { LostFoundService } from '../../core/services/lost-found.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  BadgeVariant,
  EmptyStateComponent,
  PageHeaderComponent,
  ReportItemComponent,
  StatCardComponent,
  StatusBadgeComponent,
} from '../../shared/components';

type StatusFilter = 'all' | LostFoundStatus;

/**
 * PB-17 — Lost & Found.
 *
 * Students search reports and submit a new one. The list is backed by
 * `LostFoundService`, so a report appears immediately and can move to CLAIMED
 * when the owner is reunited with the item.
 */
@Component({
  selector: 'app-lost-found',
  imports: [
    EmptyStateComponent,
    PageHeaderComponent,
    ReportItemComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './lost-found.html',
  styleUrl: './lost-found.scss',
})
export class LostFound {
  private readonly lostFoundService = inject(LostFoundService);
  private readonly notifications = inject(NotificationService);

  readonly reports = this.lostFoundService.items;

  readonly statuses = LOST_FOUND_STATUSES;
  readonly statusLabels = LOST_FOUND_STATUS_LABELS;

  readonly statusFilter = signal<StatusFilter>('all');
  readonly search = signal('');
  readonly feedback = signal<string | null>(null);

  readonly counts = computed<Record<StatusFilter, number>>(() => {
    const counts: Record<StatusFilter, number> = {
      all: 0,
      LOST: 0,
      FOUND: 0,
      CLAIMED: 0,
    };

    for (const report of this.reports()) {
      counts.all += 1;
      counts[report.status] += 1;
    }

    return counts;
  });

  readonly openCount = computed(
    () => this.reports().filter((report) => report.status !== 'CLAIMED').length,
  );

  readonly metrics = computed(() => [
    { label: 'Open reports', value: this.openCount(), hint: 'Still looking' },
    { label: 'Lost', value: this.counts().LOST, hint: 'Reported missing' },
    { label: 'Found', value: this.counts().FOUND, hint: 'Handed in' },
    { label: 'Claimed', value: this.counts().CLAIMED, hint: 'Reunited with owner' },
  ]);

  readonly filtered = computed(() => {
    const status = this.statusFilter();
    const term = this.search().trim().toLowerCase();

    return this.reports()
      .filter(
        (report) =>
          (status === 'all' || report.status === status) &&
          (!term ||
            `${report.title} ${report.category} ${report.location} ${report.description}`
              .toLowerCase()
              .includes(term)),
      )
      .sort(
        (a, b) =>
          Number(a.status === 'CLAIMED') - Number(b.status === 'CLAIMED') ||
          b.reportedAt.getTime() - a.reportedAt.getTime() ||
          b.id.localeCompare(a.id),
      );
  });

  readonly hasFilters = computed(
    () => this.statusFilter() !== 'all' || !!this.search().trim(),
  );

  setStatus(status: StatusFilter): void {
    this.statusFilter.set(status);
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  resetFilters(): void {
    this.statusFilter.set('all');
    this.search.set('');
  }

  addReport(input: LostFoundReportInput): void {
    const item = this.lostFoundService.create(input);
    this.resetFilters();
    this.notifications.add({
      message: `Un nouvel objet « ${item.title} » a été signalé à ${item.location}.`,
      type: 'LOST_FOUND',
      lostFoundId: item.id,
    });
    this.feedback.set(`"${item.title}" was added to the list.`);
  }

  claimReport(report: LostFoundItem): void {
    const claimed = this.lostFoundService.claim(report.id);
    if (claimed) {
      this.feedback.set(`"${claimed.title}" is now marked as claimed.`);
    }
  }

  dismissFeedback(): void {
    this.feedback.set(null);
  }

  statusLabel(status: LostFoundStatus): string {
    return LOST_FOUND_STATUS_LABELS[status];
  }

  statusVariant(status: LostFoundStatus): BadgeVariant {
    if (status === 'LOST') {
      return 'warning';
    }
    if (status === 'FOUND') {
      return 'success';
    }
    return 'neutral';
  }

  dateLabel(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
