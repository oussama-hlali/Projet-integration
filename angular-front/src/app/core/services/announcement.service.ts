import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Announcement } from '../models/announcement.model';

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private announcements: Announcement[] = [
    {
      id: 'a1',
      title: 'Rentrée universitaire',
      content: 'La rentrée aura lieu le 15 septembre.',
      publishedAt: new Date('2026-09-01'),
      category: 'GENERAL',
      pinned: true,
      authorId: 'u3'
    },
    {
      id: 'a2',
      title: 'Planning des examens',
      content: 'Le planning des examens est disponible.',
      publishedAt: new Date('2026-10-10'),
      category: 'ACADEMIC',
      pinned: false,
      authorId: 'u3'
    },
    {
      id: 'a3',
      title: 'Maintenance du réseau',
      content: 'Le wifi sera coupé samedi de 8h à 12h.',
      publishedAt: new Date('2026-10-12'),
      category: 'MAINTENANCE',
      pinned: false,
      authorId: 'u3'
    },
    {
      id: 'a4',
      title: 'Forum des stages',
      content: 'Le forum des stages se tiendra le 12 novembre au hall principal, de 9h à 17h.',
      publishedAt: new Date('2026-11-04'),
      category: 'EVENTS',
      pinned: true,
      authorId: 'u3'
    },
    {
      id: 'a5',
      title: 'Inscriptions aux examens',
      content: 'Les inscriptions aux examens du premier semestre ferment le 20 novembre.',
      publishedAt: new Date('2026-11-02'),
      category: 'ACADEMIC',
      pinned: false,
      authorId: 'u3'
    },
    {
      id: 'a6',
      title: 'Nouveaux horaires du secrétariat',
      content: 'Le secrétariat est désormais ouvert de 8h30 à 16h30, du lundi au jeudi.',
      publishedAt: new Date('2026-10-28'),
      category: 'ADMINISTRATIVE',
      pinned: false,
      authorId: 'u3'
    },
    {
      id: 'a7',
      title: 'Coupure de chauffage',
      content: 'Le chauffage du bloc C sera interrompu mardi matin pour entretien.',
      publishedAt: new Date('2026-10-24'),
      category: 'MAINTENANCE',
      pinned: false,
      authorId: 'u3'
    }
  ];

  getAnnouncements(): Observable<Announcement[]> {
    return of(this.announcements);
  }

  getAnnouncementById(id: string): Observable<Announcement | undefined> {
    return of(this.announcements.find(a => a.id === id));
  }
}