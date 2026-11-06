import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampusEventService } from '../../core/services/campus-event.service';
import { UserService } from '../../core/services/user.service';
import { EmptyStateComponent, StatusBadgeComponent } from '../../shared/components';
import { categoryLabel, categoryVariant, isPastEvent } from './event-meta';

/**
 * PB-10 — Event details.
 *
 * Read-only view of one campus event: the facts a student needs before
 * deciding to attend, plus the organizer's contact. Registration belongs to
 * PB-11 and is intentionally not wired here.
 */
@Component({
  selector: 'app-event-detail',
  imports: [DatePipe, RouterLink, EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss',
})
export class EventDetail {
  private readonly eventService = inject(CampusEventService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);

  readonly event = this.eventService.findById(this.route.snapshot.paramMap.get('id') ?? '');
  readonly organizer = toSignal(
    this.userService.getUserById(this.event?.organizerId ?? ''),
    { initialValue: undefined },
  );
  readonly past = this.event ? isPastEvent(this.event) : false;

  readonly categoryLabel = categoryLabel;
  readonly categoryVariant = categoryVariant;

  organizerInitial(): string {
    return this.organizer()?.fullName.trim().charAt(0).toUpperCase() ?? '?';
  }
}
