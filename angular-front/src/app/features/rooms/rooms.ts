import { Component, computed, inject } from '@angular/core';
import { RoomService } from '../../core/services/room.service';
import {
  PageHeaderComponent,
  RoomsSearchComponent,
  StatCardComponent,
} from '../../shared/components';

/**
 * PB-11 — Rooms.
 *
 * The catalogue lives in `RoomService` so the administrator management screen
 * can add, re-status or remove a room and the student search sees it at once.
 */
@Component({
  selector: 'app-rooms',
  imports: [PageHeaderComponent, RoomsSearchComponent, StatCardComponent],
  templateUrl: './rooms.html',
  styleUrl: './rooms.scss',
})
export class Rooms {
  private readonly roomService = inject(RoomService);

  readonly rooms = this.roomService.rooms;

  readonly metrics = computed(() => {
    const rooms = this.rooms();
    const count = (status: string) => rooms.filter((room) => room.status === status).length;

    return [
      { label: 'Available', value: count('AVAILABLE'), hint: 'Ready to book' },
      { label: 'Occupied', value: count('OCCUPIED'), hint: 'In use right now' },
      { label: 'Reserved', value: count('RESERVED'), hint: 'Booked for a slot' },
      {
        label: 'Maintenance',
        value: count('MAINTENANCE'),
        hint: 'Temporarily closed',
      },
      {
        label: 'Total seats',
        value: rooms.reduce((seats, room) => seats + room.capacity, 0),
        hint: 'Across all rooms',
      },
    ];
  });
}
