import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import {
  LOST_FOUND_STATUSES,
  LOST_FOUND_STATUS_LABELS,
  LostFoundItem,
  LostFoundStatus,
} from '../../../core/models/lost-found.model';
import { AdminService } from '../../../core/services/admin.service';
import { LostFoundService } from '../../../core/services/lost-found.service';
import {
  BadgeVariant,
  ConfirmDialogComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  StatCardComponent,
  StatusBadgeComponent,
} from '../../../shared/components';

type StatusFilter = 'all' | LostFoundStatus;

const STATUS_VARIANTS: Record<LostFoundStatus, BadgeVariant> = {
  LOST: 'warning',
  FOUND: 'info',
  CLAIMED: 'success',
};

/**
 * Administrator Lost & Found desk.
 *
 * Moderates student reports: claim an item once the owner is reunited with it
 * or delete an invalid report. The same store powers the student page.
 */
@Component({
  selector: 'app-admin-lost-found',
  imports: [
    DatePipe,
    ConfirmDialogComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './admin-lost-found.html',
  styleUrl: './admin-lost-found.scss',
})
export class AdminLostFound {
  private readonly admin = inject(AdminService);
  private readonly lostFoundService = inject(LostFoundService);

  protected readonly items = this.lostFoundService.items;
  protected readonly statuses = LOST_FOUND_STATUSES;
  protected readonly statusLabels = LOST_FOUND_STATUS_LABELS;

  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly search = signal('');
  protected readonly feedback = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly deleteTarget = signal<LostFoundItem | null>(null);
  protected readonly dialogOpen = signal(false);

  protected readonly metrics = computed(() => {
    const items = this.items();
    return [
      { label: 'Reports', value: items.length, hint: 'In the register' },
      {
        label: 'Lost',
        value: items.filter((item) => item.status === 'LOST').length,
        hint: 'Reported missing',
      },
      {
        label: 'Found',
        value: items.filter((item) => item.status === 'FOUND').length,
        hint: 'Handed in',
      },
      {
        label: 'Claimed',
        value: items.filter((item) => item.status === 'CLAIMED').length,
        hint: 'Reunited with owner',
      },
    ];
  });

  protected readonly filtered = computed(() => {
    const status = this.statusFilter();
    const term = this.search().trim().toLowerCase();

    return this.items()
      .filter(
        (item) =>
          (status === 'all' || item.status === status) &&
          (!term ||
            `${item.title} ${item.category} ${item.location} ${item.description}`
              .toLowerCase()
              .includes(term)),
      )
      .sort(
        (a, b) =>
          Number(a.status === 'CLAIMED') - Number(b.status === 'CLAIMED') ||
          b.reportedAt.getTime() - a.reportedAt.getTime(),
      );
  });

  protected readonly hasFilters = computed(
    () => this.statusFilter() !== 'all' || !!this.search().trim(),
  );

  protected setStatus(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as StatusFilter);
  }

  protected setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected clearFilters(): void {
    this.statusFilter.set('all');
    this.search.set('');
  }

  protected claim(item: LostFoundItem): void {
    this.feedback.set(null);
    this.error.set(null);
    const claimed = this.admin.claimLostFound(item.id);
    if (!claimed) {
      this.error.set('That report no longer exists.');
      return;
    }
    this.feedback.set(`"${claimed.title}" is now marked as claimed.`);
  }

  protected requestDelete(item: LostFoundItem): void {
    this.deleteTarget.set(item);
    this.dialogOpen.set(true);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    this.deleteTarget.set(null);
    if (!target) {
      return;
    }

    this.feedback.set(null);
    this.error.set(null);
    if (!this.admin.deleteLostFound(target.id)) {
      this.error.set('That report no longer exists.');
      return;
    }
    this.feedback.set(`"${target.title}" was removed from the register.`);
  }

  protected statusLabel(status: LostFoundStatus): string {
    return LOST_FOUND_STATUS_LABELS[status];
  }

  protected statusVariant(status: LostFoundStatus): BadgeVariant {
    return STATUS_VARIANTS[status];
  }

  protected dismissFeedback(): void {
    this.feedback.set(null);
  }

  protected dismissError(): void {
    this.error.set(null);
  }
}
