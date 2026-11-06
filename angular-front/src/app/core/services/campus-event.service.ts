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
      endDate: new Date('2026-10-25T17:00:00'),
      location: 'Amphi A',
      category: 'SOCIAL',
      capacity: 200,
      organizerId: 'u3',
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
      description: 'Projection suivie d’un débat avec le club cinéma.',
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
    },
    {
      id: 'e10',
      title: 'Dîner de fin d’année',
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
      description: 'Panorama des usages de l’IA dans la recherche.',
      date: new Date('2026-10-10T14:00:00'),
      endDate: new Date('2026-10-10T16:00:00'),
      location: 'Amphi A',
      category: 'ACADEMIC',
      capacity: 150,
      organizerId: 'u3',
    },
  ];

  getEvents(): Observable<CampusEvent[]> {
    return of(this.events);
  }

  getEventById(id: string): Observable<CampusEvent | undefined> {
    return of(this.events.find((event) => event.id === id));
  }

  /** Synchronous lookup used by the event detail page. */
  findById(id: string): CampusEvent | undefined {
    return this.events.find((event) => event.id === id);
  }
}
