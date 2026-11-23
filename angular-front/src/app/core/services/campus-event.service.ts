import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { Observable, of } from 'rxjs';
import { CampusEvent, EventCategory } from '../models/campus-event.model';
import { NotificationService } from './notification.service';
import { mapEvent } from './live-mappers';

export interface CampusEventInput {
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  location: string;
  category: EventCategory;
  capacity: number;
  organizerId?: string;
  roomId?: string;
}

/** Shared event store: Supabase in production, deterministic seeds in dev/mocks. */
@Injectable({ providedIn: 'root' })
export class CampusEventService {
  private readonly notifications = inject(NotificationService);
  private readonly http = inject(HttpClient, { optional: true });
  private readonly cfg = inject(RuntimeConfigService, { optional: true });
  private readonly state = signal<CampusEvent[]>(environment.useMocks ? this.seedEvents() : []);

  constructor() {
    if (!environment.useMocks) {
      this.http!.get<any[]>(`${this.apiBase()}/events`).subscribe({
        next: (rows) => this.state.set(rows.map(mapEvent)),
        error: () => {},
      });
    }
  }

  private apiBase(): string {
    return this.cfg!.apiBaseUrl();
  }

  private seedEvents(): CampusEvent[] {
    return [
      {
        id: 'e1',
        title: 'Journée portes ouvertes',
        description: 'Découverte des clubs du campus.',
        date: new Date('2026-10-25T09:00:00'),
        endDate: new Date('2026-10-25T17:00:00'),
        location: 'Amphi A',
        category: 'SOCIAL',
        capacity: 200,
        organizerId: 'u3',
        roomId: 'room-1',
      },
      {
        id: 'e2',
        title: 'Hackathon',
        description: 'Compétition de programmation de 24h.',
        date: new Date('2026-11-05T10:00:00'),
        endDate: new Date('2026-11-06T10:00:00'),
        location: 'Salle info 2',
        category: 'CAREER',
        capacity: 60,
        organizerId: 'u3',
        roomId: 'room-3',
      },
      {
        id: 'e3',
        title: 'Tournoi de football',
        description: 'Tournoi inter-départements.',
        date: new Date('2026-11-12T14:00:00'),
        endDate: new Date('2026-11-12T18:00:00'),
        location: 'Terrain de sport',
        category: 'SPORT',
        capacity: 100,
        organizerId: 'u3',
      },
      {
        id: 'e4',
        title: 'Ciné-club : soirée science-fiction',
        description: "Projection suivie d'un débat avec le club cinéma.",
        date: new Date('2026-11-08T18:00:00'),
        endDate: new Date('2026-11-08T21:00:00'),
        location: 'Auditorium',
        category: 'CULTURE',
        capacity: 120,
        organizerId: 'u2',
      },
      {
        id: 'e5',
        title: 'Atelier de rédaction de thèse',
        description: 'Méthodologie et outils pour structurer votre mémoire.',
        date: new Date('2026-11-10T09:30:00'),
        endDate: new Date('2026-11-10T12:00:00'),
        location: 'Salle 204',
        category: 'ACADEMIC',
        capacity: 30,
        organizerId: 'u3',
        roomId: 'room-8',
      },
      {
        id: 'e6',
        title: 'Forum des stages',
        description: 'Rencontrez les entreprises partenaires du campus.',
        date: new Date('2026-11-19T09:00:00'),
        endDate: new Date('2026-11-19T17:00:00'),
        location: 'Hall principal',
        category: 'CAREER',
        capacity: 300,
        organizerId: 'u3',
      },
      {
        id: 'e7',
        title: 'Cross du campus',
        description: 'Course de 5 km ouverte à tous les étudiants.',
        date: new Date('2026-11-21T09:00:00'),
        endDate: new Date('2026-11-21T11:00:00'),
        location: 'Parc du campus',
        category: 'SPORT',
        capacity: 150,
        organizerId: 'u2',
      },
      {
        id: 'e8',
        title: 'Concert de la chorale',
        description: 'Répertoire classique et contemporain.',
        date: new Date('2026-11-26T20:00:00'),
        endDate: new Date('2026-11-26T22:00:00'),
        location: 'Auditorium',
        category: 'CULTURE',
        capacity: 180,
        organizerId: 'u2',
      },
      {
        id: 'e9',
        title: 'Journée de la recherche',
        description: 'Présentation des projets de laboratoire.',
        date: new Date('2026-12-03T09:00:00'),
        endDate: new Date('2026-12-03T16:00:00'),
        location: 'Amphi B',
        category: 'ACADEMIC',
        capacity: 120,
        organizerId: 'u3',
        roomId: 'room-1',
      },
      {
        id: 'e10',
        title: "Dîner de fin d'année",
        description: 'Repas partagé avec les associations étudiantes.',
        date: new Date('2026-12-10T19:00:00'),
        endDate: new Date('2026-12-10T22:00:00'),
        location: 'Cafétéria',
        category: 'SOCIAL',
        capacity: 90,
        organizerId: 'u2',
      },
      {
        id: 'e11',
        title: 'Conférence intelligence artificielle',
        description: "Panorama des usages de l'IA dans la recherche.",
        date: new Date('2026-10-10T14:00:00'),
        endDate: new Date('2026-10-10T16:00:00'),
        location: 'Amphi A',
        category: 'ACADEMIC',
        capacity: 150,
        organizerId: 'u3',
        roomId: 'room-1',
      },
    ];
  }

  readonly events = this.state.asReadonly();

  getEvents(): Observable<CampusEvent[]> {
    return of(this.state());
  }

  getEventById(id: string): Observable<CampusEvent | undefined> {
    return of(this.findById(id));
  }

  /** Synchronous lookup used by the event detail page. */
  findById(id: string): CampusEvent | undefined {
    return this.state().find((event) => event.id === id);
  }

  add(input: CampusEventInput): CampusEvent {
    const event: CampusEvent = {
      ...input,
      id: `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      title: input.title.trim(),
      description: input.description.trim(),
      organizerId: input.organizerId ?? 'u3',
    };

    this.state.update((events) => [event, ...events]);
    if (environment.useMocks) {
      this.notifications.add({
        message: `Un nouvel événement « ${event.title} » a été publié.`,
        type: 'EVENT',
        eventId: event.id,
      });
    } else {
      const payload = {
        title: event.title,
        description: event.description,
        date: event.date.toISOString(),
        endDate: event.endDate?.toISOString(),
        location: event.location,
        category: event.category,
        capacity: event.capacity,
        organizerId: event.organizerId,
        roomId: event.roomId,
      };
      this.http!.post<any>(`${this.apiBase()}/events`, payload).subscribe({
        next: (row) => {
          const saved = mapEvent(row);
          this.state.update((events) => events.map((item) => (item.id === event.id ? saved : item)));
          this.notifications.add({
            message: `Un nouvel événement « ${saved.title} » a été publié.`,
            type: 'EVENT',
            eventId: saved.id,
          });
        },
        error: () => this.state.update((events) => events.filter((item) => item.id !== event.id)),
      });
    }
    return event;
  }

  update(id: string, changes: Partial<CampusEventInput>): CampusEvent | undefined {
    const target = this.findById(id);
    if (!target) return undefined;

    const updated: CampusEvent = {
      ...target,
      ...changes,
      id,
      title: changes.title?.trim() ?? target.title,
      description: changes.description?.trim() ?? target.description,
    };
    this.state.update((events) => events.map((event) => (event.id === id ? updated : event)));

    if (!environment.useMocks) {
      this.http!.put<any>(`${this.apiBase()}/events/${id}`, {
        title: updated.title,
        description: updated.description,
        category: updated.category,
        date: updated.date.toISOString(),
        endDate: updated.endDate?.toISOString(),
        location: updated.location,
        capacity: updated.capacity,
        roomId: updated.roomId,
      }).subscribe({
        next: (row) => {
          const saved = mapEvent(row);
          this.state.update((events) => events.map((event) => (event.id === id ? saved : event)));
        },
        error: () => this.state.update((events) => events.map((event) => (event.id === id ? target : event))),
      });
    }
    return updated;
  }

  remove(id: string): boolean {
    const target = this.findById(id);
    if (!target) return false;

    this.state.update((events) => events.filter((event) => event.id !== id));
    if (!environment.useMocks) {
      this.http!.delete(`${this.apiBase()}/events/${id}`).subscribe({
        error: () => this.state.update((events) => [target, ...events]),
      });
    }
    return true;
  }
}
