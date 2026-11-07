import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Announcement, AnnouncementCategory } from '../models/announcement.model';

export interface AnnouncementInput {
  title: string;
  content: string;
  category: AnnouncementCategory;
  pinned: boolean;
  authorId?: string;
}

/**
 * Announcement store used by the dashboard, the student page and the admin
 * management screen. Administrator changes are visible immediately because
 * every page reads this one signal.
 */
@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private readonly state = signal<Announcement[]>([
    {
      id: 'a1',
      title: 'Rentrée universitaire',
      content: 'La rentrée aura lieu le 15 septembre.',
      publishedAt: new Date('2026-09-01'),
      category: 'GENERAL',
      pinned: true,
      authorId: 'u3',
    },
    {
      id: 'a2',
      title: 'Planning des examens',
      content: 'Le planning des examens est disponible.',
      publishedAt: new Date('2026-10-10'),
      category: 'ACADEMIC',
      pinned: false,
      authorId: 'u3',
    },
    {
      id: 'a3',
      title: 'Maintenance du réseau',
      content: 'Le wifi sera coupé samedi de 8h à 12h.',
      publishedAt: new Date('2026-10-12'),
      category: 'MAINTENANCE',
      pinned: false,
      authorId: 'u3',
    },
    {
      id: 'a4',
      title: 'Forum des stages',
      content: 'Le forum des stages se tiendra le 12 novembre au hall principal, de 9h à 17h.',
      publishedAt: new Date('2026-11-04'),
      category: 'EVENTS',
      pinned: true,
      authorId: 'u3',
    },
    {
      id: 'a5',
      title: 'Inscriptions aux examens',
      content: 'Les inscriptions aux examens du premier semestre ferment le 20 novembre.',
      publishedAt: new Date('2026-11-02'),
      category: 'ACADEMIC',
      pinned: false,
      authorId: 'u3',
    },
    {
      id: 'a6',
      title: 'Nouveaux horaires du secrétariat',
      content: 'Le secrétariat est désormais ouvert de 8h30 à 16h30, du lundi au jeudi.',
      publishedAt: new Date('2026-10-28'),
      category: 'ADMINISTRATIVE',
      pinned: false,
      authorId: 'u3',
    },
    {
      id: 'a7',
      title: 'Coupure de chauffage',
      content: 'Le chauffage du bloc C sera interrompu mardi matin pour entretien.',
      publishedAt: new Date('2026-10-24'),
      category: 'MAINTENANCE',
      pinned: false,
      authorId: 'u3',
    },
  ]);

  readonly announcements = this.state.asReadonly();

  getAnnouncements(): Observable<Announcement[]> {
    return of(this.state());
  }

  getAnnouncementById(id: string): Observable<Announcement | undefined> {
    return of(this.state().find((announcement) => announcement.id === id));
  }

  findByTitle(title: string): Announcement | undefined {
    return this.state().find((announcement) => announcement.title === title);
  }

  add(input: AnnouncementInput): Announcement {
    const announcement: Announcement = {
      id: `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category,
      pinned: input.pinned,
      publishedAt: new Date(),
      authorId: input.authorId ?? 'u3',
    };

    this.state.update((items) => [announcement, ...items]);
    return announcement;
  }

  update(id: string, changes: Partial<AnnouncementInput>): Announcement | undefined {
    const target = this.state().find((announcement) => announcement.id === id);
    if (!target) {
      return undefined;
    }

    const updated: Announcement = {
      ...target,
      ...changes,
      id,
      title: changes.title?.trim() ?? target.title,
      content: changes.content?.trim() ?? target.content,
    };

    this.state.update((items) =>
      items.map((announcement) => (announcement.id === id ? updated : announcement)),
    );
    return updated;
  }

  remove(id: string): boolean {
    if (!this.state().some((announcement) => announcement.id === id)) {
      return false;
    }

    this.state.update((items) => items.filter((announcement) => announcement.id !== id));
    return true;
  }
}
