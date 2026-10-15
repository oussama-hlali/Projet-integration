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
    }
  ];

  getAnnouncements(): Observable<Announcement[]> {
    return of(this.announcements);
  }

  getAnnouncementById(id: string): Observable<Announcement | undefined> {
    return of(this.announcements.find(a => a.id === id));
  }
}