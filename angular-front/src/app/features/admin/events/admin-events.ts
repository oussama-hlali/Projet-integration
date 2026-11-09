import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  CampusEvent,
  EventCategory,
} from '../../../core/models/campus-event.model';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { CampusEventInput, CampusEventService } from '../../../core/services/campus-event.service';
import { RoomService } from '../../../core/services/room.service';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  StatCardComponent,
} from '../../../shared/components';

type CategoryFilter = 'all' | EventCategory;

/**
 * Administrator event calendar.
 *
 * Events created here appear on the student Events page immediately because
 * both screens read `CampusEventService`. The admin screen owns the create,
 * edit and delete flows through `AdminService`.
 */
@Component({
  selector: 'app-admin-events',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ConfirmDialogComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
  ],
  templateUrl: './admin-events.html',
  styleUrl: './admin-events.scss',
})
export class AdminEvents {
  private readonly admin = inject(AdminService);
  private readonly eventService = inject(CampusEventService);
  private readonly roomService = inject(RoomService);
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly events = this.eventService.events;
  protected readonly rooms = this.roomService.rooms;
  protected readonly categories = EVENT_CATEGORIES;
  protected readonly categoryLabels = EVENT_CATEGORY_LABELS;

  protected readonly editingId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly categoryFilter = signal<CategoryFilter>('all');
  protected readonly feedback = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly deleteTarget = signal<CampusEvent | null>(null);
  protected readonly dialogOpen = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.required, Validators.maxLength(400)]],
    date: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    location: ['', [Validators.required, Validators.maxLength(80)]],
    category: ['ACADEMIC' as EventCategory, Validators.required],
    capacity: [30, [Validators.required, Validators.min(1), Validators.max(5000)]],
    roomId: [''],
  });

  protected readonly metrics = computed(() => {
    const now = Date.now();
    const events = this.events();
    return [
      { label: 'Events', value: events.length, hint: 'On the calendar' },
      {
        label: 'Upcoming',
        value: events.filter((event) => event.date.getTime() >= now).length,
        hint: 'Still ahead',
      },
      {
        label: 'Past',
        value: events.filter((event) => event.date.getTime() < now).length,
        hint: 'Archive',
      },
      {
        label: 'Total seats',
        value: events.reduce((sum, event) => sum + event.capacity, 0),
        hint: 'Across all events',
      },
    ];
  });

  protected readonly filtered = computed(() => {
    const category = this.categoryFilter();
    const term = this.search().trim().toLowerCase();

    return this.events()
      .filter(
        (event) =>
          (category === 'all' || event.category === category) &&
          (!term ||
            `${event.title} ${event.location} ${event.description}`
              .toLowerCase()
              .includes(term)),
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  protected readonly hasFilters = computed(
    () => this.categoryFilter() !== 'all' || !!this.search().trim(),
  );

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  protected hasValidTimes(): boolean {
    const { startTime, endTime } = this.form.getRawValue();
    return !startTime || !endTime || startTime < endTime;
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

  protected startEdit(event: CampusEvent): void {
    const start = event.date;
    const end = event.endDate ?? new Date(start.getTime() + 2 * 60 * 60 * 1000);

    this.editingId.set(event.id);
    this.submitted.set(false);
    this.feedback.set(null);
    this.error.set(null);
    this.form.reset({
      title: event.title,
      description: event.description,
      date: this.toDateInput(start),
      startTime: this.toTimeInput(start),
      endTime: this.toTimeInput(end),
      location: event.location,
      category: event.category,
      capacity: event.capacity,
      roomId: event.roomId ?? '',
    });
  }

  protected submit(): void {
    this.submitted.set(true);
    this.feedback.set(null);
    this.error.set(null);

    if (!this.hasValidTimes()) {
      this.form.markAllAsTouched();
      this.error.set('The end time must be after the start time.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const input: CampusEventInput = {
      title: value.title.trim(),
      description: value.description.trim(),
      date: this.toMoment(value.date, value.startTime),
      endDate: this.toMoment(value.date, value.endTime),
      location: value.location.trim(),
      category: value.category,
      capacity: Number(value.capacity),
      roomId: value.roomId || undefined,
    };

    const id = this.editingId();
    if (id) {
      const updated = this.admin.updateEvent(id, input);
      if (!updated) {
        this.error.set('That event no longer exists.');
        return;
      }
      this.feedback.set(`${updated.title} was updated.`);
    } else {
      const created = this.admin.createEvent({
        ...input,
        organizerId: this.auth.currentUser()?.id,
      });
      this.feedback.set(`${created.title} was published to the calendar.`);
    }

    this.resetForm();
  }

  protected requestDelete(event: CampusEvent): void {
    this.deleteTarget.set(event);
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
    if (!this.admin.deleteEvent(target.id)) {
      this.error.set('That event no longer exists.');
      return;
    }

    if (this.editingId() === target.id) {
      this.resetForm();
    }
    this.feedback.set(`${target.title} was removed from the calendar.`);
  }

  protected dismissFeedback(): void {
    this.feedback.set(null);
  }

  protected dismissError(): void {
    this.error.set(null);
  }

  protected categoryLabel(category: EventCategory): string {
    return EVENT_CATEGORY_LABELS[category];
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.submitted.set(false);
    this.form.reset();
  }

  private toMoment(date: string, time: string): Date {
    return new Date(`${date}T${time}:00`);
  }

  private toDateInput(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private toTimeInput(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}
