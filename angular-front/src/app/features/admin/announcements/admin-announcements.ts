import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_CATEGORY_LABELS,
  Announcement,
  AnnouncementCategory,
} from '../../../core/models/announcement.model';
import { AdminService } from '../../../core/services/admin.service';
import {
  AnnouncementInput,
  AnnouncementService,
} from '../../../core/services/announcement.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  StatCardComponent,
} from '../../../shared/components';

type CategoryFilter = 'all' | AnnouncementCategory;

/**
 * Administrator announcement board.
 *
 * Publishing, pinning and deleting announcements all funnel through
 * `AdminService`, while the student page reads the same `AnnouncementService`
 * signal and updates without a reload.
 */
@Component({
  selector: 'app-admin-announcements',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ConfirmDialogComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
  ],
  templateUrl: './admin-announcements.html',
  styleUrl: './admin-announcements.scss',
})
export class AdminAnnouncements {
  private readonly admin = inject(AdminService);
  private readonly announcementService = inject(AnnouncementService);
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly announcements = this.announcementService.announcements;
  protected readonly categories = ANNOUNCEMENT_CATEGORIES;
  protected readonly categoryLabels = ANNOUNCEMENT_CATEGORY_LABELS;

  protected readonly editingId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly categoryFilter = signal<CategoryFilter>('all');
  protected readonly feedback = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly deleteTarget = signal<Announcement | null>(null);
  protected readonly dialogOpen = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    content: ['', [Validators.required, Validators.maxLength(600)]],
    category: ['GENERAL' as AnnouncementCategory, Validators.required],
    pinned: [false],
  });

  protected readonly metrics = computed(() => {
    const items = this.announcements();
    return [
      { label: 'Announcements', value: items.length, hint: 'Published to campus' },
      { label: 'Pinned', value: items.filter((item) => item.pinned).length, hint: 'Kept at the top' },
      { label: 'Unpinned', value: items.filter((item) => !item.pinned).length, hint: 'Standard feed' },
      {
        label: 'Categories in use',
        value: new Set(items.map((item) => item.category)).size,
        hint: 'Across the board',
      },
    ];
  });

  protected readonly filtered = computed(() => {
    const category = this.categoryFilter();
    const term = this.search().trim().toLowerCase();

    return this.announcements()
      .filter(
        (announcement) =>
          (category === 'all' || announcement.category === category) &&
          (!term ||
            `${announcement.title} ${announcement.content}`
              .toLowerCase()
              .includes(term)),
      )
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          b.publishedAt.getTime() - a.publishedAt.getTime(),
      );
  });

  protected readonly hasFilters = computed(
    () => this.categoryFilter() !== 'all' || !!this.search().trim(),
  );

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  protected setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected setCategory(event: Event): void {
    this.categoryFilter.set((event.target as HTMLSelectElement).value as CategoryFilter);
  }

  protected clearFilters(): void {
    this.categoryFilter.set('all');
    this.search.set('');
  }

  protected startCreate(): void {
    this.resetForm();
    this.feedback.set(null);
    this.error.set(null);
  }

  protected startEdit(announcement: Announcement): void {
    this.editingId.set(announcement.id);
    this.submitted.set(false);
    this.feedback.set(null);
    this.error.set(null);
    this.form.reset({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      pinned: announcement.pinned,
    });
  }

  protected submit(): void {
    this.submitted.set(true);
    this.feedback.set(null);
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const input: AnnouncementInput = {
      title: value.title.trim(),
      content: value.content.trim(),
      category: value.category,
      pinned: value.pinned,
    };

    const id = this.editingId();
    if (id) {
      const updated = this.admin.updateAnnouncement(id, input);
      if (!updated) {
        this.error.set('That announcement no longer exists.');
        return;
      }
      this.feedback.set(`${updated.title} was updated.`);
    } else {
      const created = this.admin.createAnnouncement({
        ...input,
        authorId: this.auth.currentUser()?.id,
      });
      this.feedback.set(`${created.title} was published.`);
    }

    this.resetForm();
  }

  protected togglePinned(announcement: Announcement): void {
    this.feedback.set(null);
    this.error.set(null);
    const updated = this.admin.updateAnnouncement(announcement.id, {
      pinned: !announcement.pinned,
    });

    if (!updated) {
      this.error.set('That announcement no longer exists.');
      return;
    }

    this.feedback.set(
      updated.pinned
        ? `${updated.title} is now pinned.`
        : `${updated.title} was unpinned.`,
    );
  }

  protected requestDelete(announcement: Announcement): void {
    this.deleteTarget.set(announcement);
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
    if (!this.admin.deleteAnnouncement(target.id)) {
      this.error.set('That announcement no longer exists.');
      return;
    }

    if (this.editingId() === target.id) {
      this.resetForm();
    }
    this.feedback.set(`${target.title} was deleted.`);
  }

  protected dismissFeedback(): void {
    this.feedback.set(null);
  }

  protected dismissError(): void {
    this.error.set(null);
  }

  protected categoryLabel(category: AnnouncementCategory): string {
    return ANNOUNCEMENT_CATEGORY_LABELS[category];
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.submitted.set(false);
    this.form.reset();
  }
}
