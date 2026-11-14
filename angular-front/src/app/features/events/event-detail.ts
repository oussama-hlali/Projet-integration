import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampusEventService } from '../../core/services/campus-event.service';
import { AuthService } from '../../core/services/auth.service';
import { EventInterestService } from '../../core/services/event-interest.service';
import { RegistrationService } from '../../core/services/registration.service';
import { UserService } from '../../core/services/user.service';
import { buildQrMatrix } from '../../core/utils/qr-code';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
} from '../../shared/components';
import { categoryLabel, categoryVariant, isPastEvent } from './event-meta';

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
  private readonly interestService = inject(EventInterestService);
  private readonly auth = inject(AuthService);
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

  readonly interested = computed(() =>
    this.event
      ? this.interestService.isInterested(this.event.id, this.currentUserId())
      : false,
  );

  readonly qrCells = computed(() => buildQrMatrix(this.registration()?.qrCode ?? ''));

  organizerInitial(): string {
    return this.organizer()?.fullName.trim().charAt(0).toUpperCase() ?? '?';
  }

  toggleInterest(): void {
    if (!this.event) {
      return;
    }

    const interested = this.interestService.toggle(this.event.id, this.currentUserId());
    this.feedback.set(
      interested
        ? `${this.event.title} was added to your interests.`
        : `${this.event.title} was removed from your interests.`,
    );
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

  private currentUserId(): string {
    return this.auth.currentUser()?.id ?? 'u1';
  }
}
