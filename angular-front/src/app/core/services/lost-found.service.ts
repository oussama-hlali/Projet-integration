import { Injectable, signal } from '@angular/core';
import {
  LostFoundItem,
  LostFoundReportInput,
  LostFoundStatus,
} from '../models/lost-found.model';

const STORAGE_KEY = 'smart-campus.lost-found';
const DEMO_USER_ID = 'u1';

/**
 * Lost & Found store. Reports are created from the report form and move to
 * CLAIMED when the owner is reunited with the item, matching the diagram's
 * `LostFoundStatus` enum.
 */
@Injectable({ providedIn: 'root' })
export class LostFoundService {
  private readonly state = signal<LostFoundItem[]>(this.load());

  readonly items = this.state.asReadonly();

  findById(id: string): LostFoundItem | undefined {
    return this.state().find((item) => item.id === id);
  }

  create(input: LostFoundReportInput, reporterId: string = DEMO_USER_ID): LostFoundItem {
    const item: LostFoundItem = {
      id: `lf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      title: input.title.trim(),
      description: input.description.trim(),
      location: input.location.trim(),
      reportedAt: input.reportedAt,
      status: input.status,
      category: input.category,
      contactPhone: input.contactPhone,
      reporterId,
    };

    this.commit([item, ...this.state()]);
    return item;
  }

  setStatus(id: string, status: LostFoundStatus): LostFoundItem | undefined {
    const target = this.findById(id);
    if (!target) {
      return undefined;
    }

    const updated: LostFoundItem = { ...target, status };
    this.commit(this.state().map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  claim(id: string): LostFoundItem | undefined {
    return this.setStatus(id, 'CLAIMED');
  }

  remove(id: string): boolean {
    if (!this.findById(id)) {
      return false;
    }

    this.commit(this.state().filter((item) => item.id !== id));
    return true;
  }

  private commit(items: LostFoundItem[]): void {
    this.state.set(items);
    this.persist(items);
  }

  private load(): LostFoundItem[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) {
            return parsed.map((entry) => {
              const value = entry as Record<string, unknown>;
              return {
                id: String(value['id']),
                title: String(value['title']),
                description: String(value['description']),
                location: String(value['location']),
                reportedAt: new Date(String(value['reportedAt'])),
                status: this.normalizeStatus(value['status']),
                category: String(value['category'] ?? 'Autre'),
                contactPhone: value['contactPhone'] as string | undefined,
                reporterId: String(value['reporterId'] ?? DEMO_USER_ID),
              } satisfies LostFoundItem;
            });
          }
        }
      } catch {
        // Fall through to the demo items.
      }
    }

    return this.seed();
  }

  private normalizeStatus(value: unknown): LostFoundStatus {
    return value === 'FOUND' || value === 'CLAIMED' || value === 'LOST' ? value : 'LOST';
  }

  private persist(items: LostFoundItem[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          items.map((item) => ({
            ...item,
            reportedAt: item.reportedAt.toISOString(),
          })),
        ),
      );
    } catch {
      // Storage can be full or blocked; the in-memory list still works.
    }
  }

  private seed(): LostFoundItem[] {
    return [
      {
        id: 'lf-1',
        title: 'Clés de voiture',
        category: 'Clés',
        description: 'Trousseau avec un porte-clés bleu et une télécommande.',
        location: 'Parking du Bloc B',
        reportedAt: new Date('2026-11-06T08:15:00'),
        status: 'FOUND',
        contactPhone: '12345678',
        reporterId: 'u2',
      },
      {
        id: 'lf-2',
        title: 'Carte étudiante',
        category: 'Documents',
        description: 'Carte au nom de Yasmine B., perdue entre la bibliothèque et le Bloc A.',
        location: 'Bibliothèque',
        reportedAt: new Date('2026-11-05T14:40:00'),
        status: 'LOST',
        contactPhone: '23456789',
        reporterId: DEMO_USER_ID,
      },
      {
        id: 'lf-3',
        title: 'Écouteurs sans fil',
        category: 'Électronique',
        description: 'Boîtier blanc trouvé sur une table près de la cafétéria.',
        location: 'Cafétéria',
        reportedAt: new Date('2026-11-04T12:20:00'),
        status: 'FOUND',
        reporterId: 'u2',
      },
      {
        id: 'lf-4',
        title: 'Veste noire',
        category: 'Vêtements',
        description: 'Veste noire avec capuche, oubliée après le cours de 14h.',
        location: 'Amphi A',
        reportedAt: new Date('2026-11-03T16:10:00'),
        status: 'LOST',
        contactPhone: '34567890',
        reporterId: 'u2',
      },
      {
        id: 'lf-5',
        title: 'Calculatrice scientifique',
        category: 'Électronique',
        description: 'Calculatrice modèle graphique, gravée au nom de "M. K.".',
        location: 'Salle 12',
        reportedAt: new Date('2026-11-02T10:05:00'),
        status: 'CLAIMED',
        reporterId: 'u3',
      },
      {
        id: 'lf-6',
        title: 'Clés de maison',
        category: 'Clés',
        description: 'Petit trousseau avec deux clés et un badge vert.',
        location: 'Bloc C',
        reportedAt: new Date('2026-10-31T18:30:00'),
        status: 'CLAIMED',
        contactPhone: '45678901',
        reporterId: 'u2',
      },
    ];
  }
}
