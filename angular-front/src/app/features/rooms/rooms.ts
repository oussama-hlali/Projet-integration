import { Component, computed } from '@angular/core';
import { Room } from '../../core/models/room.model';
import {
  PageHeaderComponent,
  RoomsSearchComponent,
  StatCardComponent,
} from '../../shared/components';

/**
 * PB-11 — Rooms.
 *
 * Demo catalogue used by the search panel. Keeping it in the page lets the
 * admin screen reuse `RoomsSearchComponent` with a different source later.
 */
const DEMO_ROOMS: readonly Room[] = [
  {
    id: 1,
    name: 'Amphi A',
    building: 'Bloc C',
    capacity: 200,
    facilities: ['Projecteur', 'Sonorisation', 'Climatisation'],
    status: 'available',
  },
  {
    id: 2,
    name: 'Salle 12',
    building: 'Bloc A',
    capacity: 40,
    facilities: ['Wi-Fi', 'Projecteur', 'Tableau blanc'],
    status: 'occupied',
  },
  {
    id: 3,
    name: 'Labo info 2',
    building: 'Bloc B',
    capacity: 25,
    facilities: ['Wi-Fi', 'Ordinateurs', 'Projecteur'],
    status: 'available',
  },
  {
    id: 4,
    name: 'Salle 07',
    building: 'Bloc A',
    capacity: 30,
    facilities: ['Tableau blanc'],
    status: 'maintenance',
  },
  {
    id: 5,
    name: 'Salle de réunion 1',
    building: 'Bloc D',
    capacity: 12,
    facilities: ['Wi-Fi', 'Visio', 'Écran'],
    status: 'available',
  },
  {
    id: 6,
    name: 'Salle calme',
    building: 'Bibliothèque',
    capacity: 60,
    facilities: ['Wi-Fi', 'Prises'],
    status: 'occupied',
  },
  {
    id: 7,
    name: 'Labo chimie',
    building: 'Bloc F',
    capacity: 24,
    facilities: ['Hotte', 'Équipements de sécurité'],
    status: 'maintenance',
  },
  {
    id: 8,
    name: 'Salle 21',
    building: 'Bloc B',
    capacity: 35,
    facilities: ['Wi-Fi', 'Projecteur', 'Tableau blanc', 'Climatisation'],
    status: 'available',
  },
  {
    id: 9,
    name: 'Studio multimédia',
    building: 'Bloc D',
    capacity: 8,
    facilities: ['Wi-Fi', 'Caméra', 'Micros'],
    status: 'available',
  },
  {
    id: 10,
    name: 'Salle 03',
    building: 'Bloc A',
    capacity: 45,
    facilities: ['Wi-Fi', 'Projecteur'],
    status: 'occupied',
  },
];

@Component({
  selector: 'app-rooms',
  imports: [PageHeaderComponent, RoomsSearchComponent, StatCardComponent],
  templateUrl: './rooms.html',
  styleUrl: './rooms.scss',
})
export class Rooms {
  readonly rooms = DEMO_ROOMS;

  readonly metrics = computed(() => [
    {
      label: 'Available',
      value: this.rooms.filter((room) => room.status === 'available').length,
      hint: 'Ready to book',
    },
    {
      label: 'Occupied',
      value: this.rooms.filter((room) => room.status === 'occupied').length,
      hint: 'In use right now',
    },
    {
      label: 'Maintenance',
      value: this.rooms.filter((room) => room.status === 'maintenance').length,
      hint: 'Temporarily closed',
    },
    {
      label: 'Total seats',
      value: this.rooms.reduce((seats, room) => seats + room.capacity, 0),
      hint: 'Across all rooms',
    },
  ]);
}
