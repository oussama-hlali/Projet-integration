import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  ROOM_STATUSES,
  ROOM_STATUS_LABELS,
  Room,
  RoomInput,
  RoomStatus,
} from '../../../core/models/room.model';
import { AdminService } from '../../../core/services/admin.service';
import { BuildingService } from '../../../core/services/building.service';
import { RoomService } from '../../../core/services/room.service';
import {
  BadgeVariant,
  ConfirmDialogComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  StatCardComponent,
  StatusBadgeComponent,
} from '../../../shared/components';

const STATUS_VARIANTS: Record<RoomStatus, BadgeVariant> = {
  AVAILABLE: 'success',
  OCCUPIED: 'info',
  RESERVED: 'warning',
  MAINTENANCE: 'danger',
};

type StatusFilter = 'all' | RoomStatus;

/**
 * Administrator room catalogue.
 *
 * Create, edit, re-status and delete rooms. A room that still has an active
 * booking cannot be deleted; the rule lives in `AdminService` so the public
 * reservation page never points at a missing room.
 */
@Component({
  selector: 'app-admin-rooms',
  imports: [
    ReactiveFormsModule,
    ConfirmDialogComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './admin-rooms.html',
  styleUrl: './admin-rooms.scss',
})
export class AdminRooms {
  private readonly admin = inject(AdminService);
  private readonly roomService = inject(RoomService);
  private readonly buildingService = inject(BuildingService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly rooms = this.roomService.rooms;
  protected readonly buildings = this.buildingService.buildings;
  protected readonly statuses = ROOM_STATUSES;
  protected readonly statusLabels = ROOM_STATUS_LABELS;

  protected readonly editingId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly feedback = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly deleteTarget = signal<Room | null>(null);
  protected readonly dialogOpen = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    buildingId: ['', Validators.required],
    capacity: [20, [Validators.required, Validators.min(1), Validators.max(1000)]],
    facilities: [''],
    status: ['AVAILABLE' as RoomStatus, Validators.required],
  });

  protected readonly metrics = computed(() => [
    { label: 'Rooms', value: this.rooms().length, hint: 'In the catalogue' },
    {
      label: 'Available',
      value: this.rooms().filter((room) => room.status === 'AVAILABLE').length,
      hint: 'Ready to book',
    },
    {
      label: 'Reserved / occupied',
      value: this.rooms().filter(
        (room) => room.status === 'RESERVED' || room.status === 'OCCUPIED',
      ).length,
      hint: 'In use or booked',
    },
    {
      label: 'Maintenance',
      value: this.rooms().filter((room) => room.status === 'MAINTENANCE').length,
      hint: 'Closed for works',
    },
  ]);

  protected readonly filtered = computed(() => {
    const status = this.statusFilter();
    const term = this.search().trim().toLowerCase();

    return this.rooms()
      .filter(
        (room) =>
          (status === 'all' || room.status === status) &&
          (!term ||
            `${room.name} ${room.building} ${room.facilities.join(' ')}`
              .toLowerCase()
              .includes(term)),
      )
      .sort(
        (a, b) => a.building.localeCompare(b.building) || a.name.localeCompare(b.name),
      );
  });

  protected readonly hasFilters = computed(
    () => this.statusFilter() !== 'all' || !!this.search().trim(),
  );

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  protected setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected setStatus(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as StatusFilter);
  }

  protected clearFilters(): void {
    this.statusFilter.set('all');
    this.search.set('');
  }

  protected startCreate(): void {
    this.resetForm();
    this.feedback.set(null);
    this.error.set(null);
  }

  protected startEdit(room: Room): void {
    this.editingId.set(room.id);
    this.submitted.set(false);
    this.error.set(null);
    this.feedback.set(null);
    this.form.reset({
      name: room.name,
      buildingId: room.buildingId,
      capacity: room.capacity,
      facilities: room.facilities.join(', '),
      status: room.status,
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
    const input: RoomInput = {
      name: value.name.trim(),
      buildingId: value.buildingId,
      building: this.buildingService.nameOf(value.buildingId),
      capacity: Number(value.capacity),
      facilities: value.facilities
        .split(',')
        .map((facility) => facility.trim())
        .filter((facility) => facility.length > 0),
      status: value.status,
    };

    const id = this.editingId();
    if (id) {
      const updated = this.admin.updateRoom(id, input);
      if (!updated) {
        this.error.set('That room no longer exists.');
        return;
      }
      this.feedback.set(`${updated.name} was updated.`);
    } else {
      const room = this.admin.createRoom(input);
      this.feedback.set(`${room.name} was added to the catalogue.`);
    }

    this.resetForm();
  }

  protected requestDelete(room: Room): void {
    this.deleteTarget.set(room);
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
    const result = this.admin.deleteRoom(target.id);
    if (!result.ok) {
      this.error.set(
        result.reason === 'room-in-use'
          ? `${target.name} still has an active booking and cannot be deleted.`
          : 'That room no longer exists.',
      );
      return;
    }

    if (this.editingId() === target.id) {
      this.resetForm();
    }
    this.feedback.set(`${target.name} was removed from the catalogue.`);
  }

  protected dismissFeedback(): void {
    this.feedback.set(null);
  }

  protected dismissError(): void {
    this.error.set(null);
  }

  protected statusLabel(status: RoomStatus): string {
    return ROOM_STATUS_LABELS[status];
  }

  protected statusVariant(status: RoomStatus): BadgeVariant {
    return STATUS_VARIANTS[status];
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.submitted.set(false);
    this.form.reset();
  }
}
