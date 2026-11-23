import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { Room, RoomInput } from '../models/room.model';
import { BuildingService } from './building.service';
import { mapRoom } from './live-mappers';

/**
 * Room catalogue.
 *
 * The student search page and the administrator management page share this
 * signal store. Production reads and writes the campus service; mock mode
 * keeps the deterministic demo catalogue.
 */
@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly buildings = inject(BuildingService);
  private readonly http = inject(HttpClient, { optional: true });
  private readonly cfg = inject(RuntimeConfigService, { optional: true });
  private readonly state = signal<Room[]>(environment.useMocks ? this.load() : []);

  constructor() {
    if (!environment.useMocks) {
      this.http!.get<any[]>(`${this.apiBase()}/rooms`).subscribe({
        next: (rows) =>
          this.commit(
            rows.map((row) => mapRoom(row, this.buildings.nameOf(row?.buildingId))),
          ),
        error: () => {},
      });
    }
  }

  private apiBase(): string {
    return this.cfg!.apiBaseUrl();
  }

  readonly rooms = this.state.asReadonly();

  findById(id: string): Room | undefined {
    return this.state().find((room) => room.id === id);
  }

  add(input: RoomInput): Room {
    const room: Room = { ...input, id: this.newId() };
    this.commit([...this.state(), room]);
    if (!environment.useMocks) {
      this.http!.post<any>(`${this.apiBase()}/rooms`, this.roomPayload(input)).subscribe({
        next: (row) => this.replace(room.id, mapRoom(row, input.building)),
        error: () => this.commit(this.state().filter((candidate) => candidate.id !== room.id)),
      });
    }
    return room;
  }

  update(id: string, changes: Partial<RoomInput>): Room | undefined {
    const target = this.findById(id);
    if (!target) {
      return undefined;
    }

    const updated: Room = { ...target, ...changes, id };
    this.replace(id, updated);
    if (!environment.useMocks) {
      this.http!.put<any>(`${this.apiBase()}/rooms/${id}`, {
        name: updated.name,
        capacity: updated.capacity,
        type: this.roomType(updated),
        status: updated.status,
      }).subscribe({
        next: (row) => this.replace(id, mapRoom(row, updated.building)),
        error: () => this.replace(id, target),
      });
    }
    return updated;
  }

  remove(id: string): boolean {
    const target = this.findById(id);
    if (!target) {
      return false;
    }

    this.commit(this.state().filter((room) => room.id !== id));
    if (!environment.useMocks) {
      this.http!.delete(`${this.apiBase()}/rooms/${id}`).subscribe({
        error: () => this.commit([...this.state(), target]),
      });
    }
    return true;
  }

  /** The campus table stores one `type`; the UI models it as facilities. */
  private roomType(room: RoomInput | Room): string | null {
    const facilities = room.facilities ?? [];
    return facilities.length ? facilities[0] : null;
  }

  private roomPayload(input: RoomInput): Record<string, unknown> {
    return {
      buildingId: input.buildingId,
      name: input.name,
      capacity: input.capacity,
      type: this.roomType(input),
      status: input.status,
    };
  }

  private replace(id: string, room: Room): void {
    this.commit(this.state().map((candidate) => (candidate.id === id ? room : candidate)));
  }

  private newId(): string {
    return `room-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  private commit(rooms: Room[]): void {
    this.state.set(rooms);
  }

  private load(): Room[] {
    return this.seed();
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
