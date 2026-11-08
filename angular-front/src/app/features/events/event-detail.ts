import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampusEventService } from '../../core/services/campus-event.service';
import { RegistrationService } from '../../core/services/registration.service';
import { UserService } from '../../core/services/user.service';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
} from '../../shared/components';
import { categoryLabel, categoryVariant, isPastEvent } from './event-meta';

const QR_SIZE = 21;

/**
 * PB-10 — Event details.
 *
 * Read-only facts plus the diagram's `register(user)` / `unregister(user)`
 * use case. Registering creates an `EventRegistration` and reveals the QR
 * code that students show at the entrance.
 */
@Component({
  selector: 'app-event-detail',
  imports: [DatePipe, RouterLink, ConfirmDialogComponent, EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss',
})
export class EventDetail {
  private readonly eventService = inject(CampusEventService);
  private readonly userService = inject(UserService);
  private readonly registrationService = inject(RegistrationService);
  private readonly route = inject(ActivatedRoute);

  readonly event = this.eventService.findById(this.route.snapshot.paramMap.get('id') ?? '');
  readonly organizer = toSignal(
    this.userService.getUserById(this.event?.organizerId ?? ''),
    { initialValue: undefined },
  );
  readonly past = this.event ? isPastEvent(this.event) : false;

  readonly categoryLabel = categoryLabel;
  readonly categoryVariant = categoryVariant;

  readonly registration = computed(() =>
    this.event ? this.registrationService.findForEvent(this.event.id) : undefined,
  );
  readonly registered = computed(() => !!this.registration());
  readonly registeredCount = computed(() =>
    this.event ? this.registrationService.countFor(this.event.id) : 0,
  );

  readonly feedback = signal<string | null>(null);
  readonly dialogOpen = signal(false);

  readonly qrCells = computed(() => this.buildQr(this.registration()?.qrCode ?? ''));

  organizerInitial(): string {
    return this.organizer()?.fullName.trim().charAt(0).toUpperCase() ?? '?';
  }

  register(): void {
    const event = this.event;
    if (!event) {
      return;
    }

    if (this.registeredCount() >= event.capacity) {
      this.feedback.set('This event is full. Unregister another attendee first.');
      return;
    }

    const registration = this.registrationService.register(event.id);
    this.feedback.set(
      `You are registered. Show QR ${registration.qrCode} at the entrance.`,
    );
  }

  requestUnregister(): void {
    this.dialogOpen.set(true);
  }

  confirmUnregister(): void {
    if (!this.event) {
      return;
    }

    this.registrationService.unregister(this.event.id);
    this.feedback.set(`Your registration for ${this.event.title} was cancelled.`);
  }

  dismissFeedback(): void {
    this.feedback.set(null);
  }

  /**
   * Deterministic QR-looking grid generated from the registration code, with
   * the three finder squares a scanner expects. No external library needed.
   */
  private buildQr(code: string): boolean[] {
    const cells = new Array<boolean>(QR_SIZE * QR_SIZE).fill(false);
    if (!code) {
      return cells;
    }

    let hash = 2166136261;
    for (let i = 0; i < code.length; i += 1) {
      hash ^= code.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    for (let i = 0; i < cells.length; i += 1) {
      hash ^= hash << 13;
      hash ^= hash >>> 17;
      hash ^= hash << 5;
      cells[i] = (hash & 1) === 1;
    }

    const finder = (row: number, col: number): void => {
      for (let r = 0; r < 7; r += 1) {
        for (let c = 0; c < 7; c += 1) {
          const border = r === 0 || r === 6 || c === 0 || c === 6;
          const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          const index = (row + r) * QR_SIZE + (col + c);
          cells[index] = border || core;
        }
      }
    };

    finder(0, 0);
    finder(0, QR_SIZE - 7);
    finder(QR_SIZE - 7, 0);

    return cells;
  }
}
