import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CampusEvent } from '../models/campus-event.model';

@Injectable({ providedIn: 'root' })
export class CampusEventService {
  private events: CampusEvent[] = [
    {
      id: 'e1',
      title: 'Journée portes ouvertes',
      description: 'Découverte des clubs du campus.',
      date: new Date('2026-10-25T09:00:00'),
      location: 'Amphi A',
      category: 'SOCIAL',
      capacity: 200,
      organizerId: 'u3'
    },
    {
      id: 'e2',
      title: 'Hackathon',
      description: 'Compétition de programmation de 24h.',
      date: new Date('2026-11-05T10:00:00'),
      location: 'Salle info 2',
      category: 'CAREER',
      capacity: 60,
      organizerId: 'u3'
    },
    {
      id: 'e3',
      title: 'Tournoi de football',
      description: 'Tournoi inter-départements.',
      date: new Date('2026-11-12T14:00:00'),
      location: 'Terrain de sport',
      category: 'SPORT',
      capacity: 100,
      organizerId: 'u3'
    }
  ];

  getEvents(): Observable<CampusEvent[]> {
    return of(this.events);
  }

  getEventById(id: string): Observable<CampusEvent | undefined> {
    return of(this.events.find(e => e.id === id));
  }
}