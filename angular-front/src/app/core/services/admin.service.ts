import { Injectable, computed, inject } from '@angular/core';

import { Announcement } from '../models/announcement.model';
import { CampusEvent } from '../models/campus-event.model';
import { LostFoundItem } from '../models/lost-found.model';
import { Reservation } from '../models/reservation.model';
import { Room, RoomInput } from '../models/room.model';
import { User, UserRole } from '../models/user.model';
import { AnnouncementInput, AnnouncementService } from './announcement.service';
import { AuthService } from './auth.service';
import { CampusEventInput, CampusEventService } from './campus-event.service';
import { LostFoundService } from './lost-found.service';
import { NotificationService } from './notification.service';
import { ReservationService } from './reservation.service';
import { RoomService } from './room.service';
import { UserService } from './user.service';

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  fullName: string;
  email: string;
  role: UserRole;
  /** Optional reset; leave empty to keep the current password. */
  password?: string;
}

export type AdminFailure =
  | 'not-found'
  | 'email-taken'
  | 'weak-password'
  | 'last-admin'
  | 'self-delete'
  | 'room-in-use';

export type AdminResult = { ok: true } | { ok: false; reason: AdminFailure };

/**
 * Administrator facade over the domain stores.
 *
 * The admin screens never call the individual stores directly: this service
 * keeps the cross-entity rules (no deleting your own account, no deleting the
 * last administrator, no deleting a room with active bookings) in one place.
 * Read models stay on the existing services so student and admin screens share
 * the same signals.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly auth = inject(AuthService);
  private readonly users = inject(UserService);
  private readonly rooms = inject(RoomService);
  private readonly events = inject(CampusEventService);
  private readonly announcements = inject(AnnouncementService);
  private readonly reservations = inject(ReservationService);
  private readonly lostFound = inject(LostFoundService);
  private readonly notifications = inject(NotificationService);

  readonly pendingReservations = computed(() =>
    this.reservations
      .reservations()
      .filter((reservation) => reservation.status === 'PENDING')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
  );

  readonly recentReservations = computed<readonly Reservation[]>(() =>
    [...this.reservations.reservations()]
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 5),
  );

  readonly recentAnnouncements = computed<readonly Announcement[]>(() =>
    [...this.announcements.announcements()]
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, 4),
  );

  readonly recentUsers = computed<readonly User[]>(() =>
    [...this.users.users()].slice(-4).reverse(),
  );

  readonly recentActivity = computed(() =>
    [...this.notifications.notifications()]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6),
  );

  async createUser(input: CreateUserInput): Promise<AdminResult> {
    const result = await this.auth.createManagedUser(input);
    return result.ok ? { ok: true } : { ok: false, reason: result.reason };
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<AdminResult> {
    const target = this.users.findById(id);
    if (!target) {
      return { ok: false, reason: 'not-found' };
    }

    const email = input.email.trim();
    if (
      this.users
        .users()
        .some((user) => user.id !== id && user.email.toLowerCase() === email.toLowerCase())
    ) {
      return { ok: false, reason: 'email-taken' };
    }

    const admins = this.users.users().filter((user) => user.role === 'ADMINISTRATOR');
    if (
      target.role === 'ADMINISTRATOR' &&
      input.role !== 'ADMINISTRATOR' &&
      admins.length <= 1
    ) {
      return { ok: false, reason: 'last-admin' };
    }

    this.users.updateProfile(id, {
      fullName: input.fullName.trim(),
      email,
      avatarUrl: target.avatarUrl,
    });
    if (input.role !== target.role) {
      this.users.updateRole(id, input.role);
    }

    if (input.password) {
      const reset = await this.auth.resetPassword(id, input.password);
      if (!reset) {
        return { ok: false, reason: 'weak-password' };
      }
    }

    return { ok: true };
  }

  deleteUser(id: string): AdminResult {
    const target = this.users.findById(id);
    if (!target) {
      return { ok: false, reason: 'not-found' };
    }
    if (this.auth.currentUser()?.id === id) {
      return { ok: false, reason: 'self-delete' };
    }
    if (
      target.role === 'ADMINISTRATOR' &&
      this.users.users().filter((user) => user.role === 'ADMINISTRATOR').length <= 1
    ) {
      return { ok: false, reason: 'last-admin' };
    }

    return this.users.remove(id)
      ? { ok: true }
      : { ok: false, reason: 'not-found' };
  }

  createRoom(input: RoomInput): Room {
    return this.rooms.add(input);
  }

  updateRoom(id: string, changes: Partial<RoomInput>): Room | undefined {
    return this.rooms.update(id, changes);
  }

  deleteRoom(id: string): AdminResult {
    const hasActiveBooking = this.reservations
      .reservations()
      .some(
        (reservation) =>
          reservation.roomId === id &&
          (reservation.status === 'PENDING' || reservation.status === 'CONFIRMED'),
      );

    if (hasActiveBooking) {
      return { ok: false, reason: 'room-in-use' };
    }

    return this.rooms.remove(id) ? { ok: true } : { ok: false, reason: 'not-found' };
  }

  createEvent(input: CampusEventInput): CampusEvent {
    return this.events.add(input);
  }

  updateEvent(id: string, changes: Partial<CampusEventInput>): CampusEvent | undefined {
    return this.events.update(id, changes);
  }

  deleteEvent(id: string): boolean {
    return this.events.remove(id);
  }

  createAnnouncement(input: AnnouncementInput): Announcement {
    return this.announcements.add(input);
  }

  updateAnnouncement(id: string, changes: Partial<AnnouncementInput>): Announcement | undefined {
    return this.announcements.update(id, changes);
  }

  deleteAnnouncement(id: string): boolean {
    return this.announcements.remove(id);
  }

  approveReservation(id: string): Reservation | undefined {
    return this.reservations.approve(id);
  }

  completeReservation(id: string): Reservation | undefined {
    return this.reservations.complete(id);
  }

  cancelReservation(id: string): Reservation | undefined {
    return this.reservations.cancel(id);
  }

  claimLostFound(id: string): LostFoundItem | undefined {
    return this.lostFound.claim(id);
  }

  deleteLostFound(id: string): boolean {
    return this.lostFound.remove(id);
  }
}
