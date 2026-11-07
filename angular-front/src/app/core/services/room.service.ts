import { Injectable, inject, signal } from '@angular/core';
import { Room, RoomInput } from '../models/room.model';
import { BuildingService } from './building.service';

const STORAGE_KEY = 'smart-campus.rooms';

/**
 * Room catalogue.
 *
 * The student search page and the administrator management page share this
 * signal store, so a room added or re-statused by an admin is visible on the
 * public page immediately.
 */
@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly buildings = inject(BuildingService);
  private readonly state = signal<Room[]>(this.load());

  readonly rooms = this.state.asReadonly();

  findById(id: string): Room | undefined {
    return this.state().find((room) => room.id === id);
  }

  add(input: RoomInput): Room {
    const room: Room = { ...input, id: this.newId() };
    this.commit([...this.state(), room]);
    return room;
  }

  update(id: string, changes: Partial<RoomInput>): Room | undefined {
    const target = this.findById(id);
    if (!target) {
      return undefined;
    }

    const updated: Room = { ...target, ...changes, id };
    this.commit(this.state().map((room) => (room.id === id ? updated : room)));
    return updated;
  }

  remove(id: string): boolean {
    if (!this.findById(id)) {
      return false;
    }

    this.commit(this.state().filter((room) => room.id !== id));
    return true;
  }

  private newId(): string {
    return `room-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  private commit(rooms: Room[]): void {
    this.state.set(rooms);
    this.persist(rooms);
  }

  private load(): Room[] {
    const stored = this.read();
    if (stored) {
      return stored;
    }

    const seeded = this.seed();
    this.persist(seeded);
    return seeded;
  }

  private read(): Room[] | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return null;
      }

      const rows = parsed.filter(
        (entry): entry is Room =>
          !!entry &&
          typeof entry === 'object' &&
          typeof (entry as Room).id === 'string' &&
          typeof (entry as Room).name === 'string' &&
          typeof (entry as Room).status === 'string',
      );

      return rows.length ? rows : null;
    } catch {
      return null;
    }
  }

  private persist(rooms: Room[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    } catch {
      // Storage can be full or blocked; the in-memory store still works.
    }
  }

  private seed(): Room[] {
    const building = (id: string): string => this.buildings.nameOf(id);

    return [
      {
        id: 'room-1',
        name: 'Amphi A',
        buildingId: 'b-c',
        building: building('b-c'),
        capacity: 200,
        facilities: ['Projecteur', 'Sonorisation', 'Climatisation'],
        status: 'AVAILABLE',
      },
      {
        id: 'room-2',
        name: 'Salle 12',
        buildingId: 'b-a',
        building: building('b-a'),
        capacity: 40,
        facilities: ['Wi-Fi', 'Projecteur', 'Tableau blanc'],
        status: 'OCCUPIED',
      },
      {
        id: 'room-3',
        name: 'Labo info 2',
        buildingId: 'b-b',
        building: building('b-b'),
        capacity: 25,
        facilities: ['Wi-Fi', 'Ordinateurs', 'Projecteur'],
        status: 'AVAILABLE',
      },
      {
        id: 'room-4',
        name: 'Salle 07',
        buildingId: 'b-a',
        building: building('b-a'),
        capacity: 30,
        facilities: ['Tableau blanc'],
        status: 'MAINTENANCE',
      },
      {
        id: 'room-5',
        name: 'Salle de réunion 1',
        buildingId: 'b-d',
        building: building('b-d'),
        capacity: 12,
        facilities: ['Wi-Fi', 'Visio', 'Écran'],
        status: 'RESERVED',
      },
      {
        id: 'room-6',
        name: 'Salle calme',
        buildingId: 'b-lib',
        building: building('b-lib'),
        capacity: 60,
        facilities: ['Wi-Fi', 'Prises'],
        status: 'OCCUPIED',
      },
      {
        id: 'room-7',
        name: 'Labo chimie',
        buildingId: 'b-f',
        building: building('b-f'),
        capacity: 24,
        facilities: ['Hotte', 'Équipements de sécurité'],
        status: 'MAINTENANCE',
      },
      {
        id: 'room-8',
        name: 'Salle 21',
        buildingId: 'b-b',
        building: building('b-b'),
        capacity: 35,
        facilities: ['Wi-Fi', 'Projecteur', 'Tableau blanc', 'Climatisation'],
        status: 'AVAILABLE',
      },
      {
        id: 'room-9',
        name: 'Studio multimédia',
        buildingId: 'b-d',
        building: building('b-d'),
        capacity: 8,
        facilities: ['Wi-Fi', 'Caméra', 'Micros'],
        status: 'AVAILABLE',
      },
      {
        id: 'room-10',
        name: 'Salle 03',
        buildingId: 'b-a',
        building: building('b-a'),
        capacity: 45,
        facilities: ['Wi-Fi', 'Projecteur'],
        status: 'AVAILABLE',
      },
      {
        id: 'room-11',
        name: 'Innovation Lab',
        buildingId: 'b-d',
        building: building('b-d'),
        capacity: 20,
        facilities: ['Wi-Fi', 'Projecteur', 'Tables modulables'],
        status: 'AVAILABLE',
      },
      {
        id: 'room-12',
        name: 'Study Room A',
        buildingId: 'b-lib',
        building: building('b-lib'),
        capacity: 10,
        facilities: ['Wi-Fi', 'Prises'],
        status: 'AVAILABLE',
      },
      {
        id: 'room-13',
        name: 'Study Room B',
        buildingId: 'b-lib',
        building: building('b-lib'),
        capacity: 10,
        facilities: ['Wi-Fi', 'Prises'],
        status: 'AVAILABLE',
      },
      {
        id: 'room-14',
        name: 'Conference Room',
        buildingId: 'b-d',
        building: building('b-d'),
        capacity: 16,
        facilities: ['Wi-Fi', 'Visio', 'Écran'],
        status: 'AVAILABLE',
      },
    ];
  }
}
