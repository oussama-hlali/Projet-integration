import { Injectable, inject, signal } from '@angular/core';
import {
  LostFoundComment,
  LostFoundCommentInput,
  LostFoundItem,
  LostFoundReportInput,
  LostFoundStatus,
} from '../models/lost-found.model';
import { NotificationService } from './notification.service';

const STORAGE_KEY = 'smart-campus.lost-found';
const DEMO_USER_ID = 'u1';

/**
 * Lost & Found community store.
 *
 * Posts are created from the composer, can be commented on and reacted to, and
 * move to CLAIMED when the owner is reunited with the item. Tagged people are
 * stored as user ids so the page can render mentions.
 */
@Injectable({ providedIn: 'root' })
export class LostFoundService {
  private readonly notifications = inject(NotificationService);
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
      taggedUserIds: this.uniqueIds(input.taggedUserIds ?? []),
      comments: [],
      reactionUserIds: [],
    };

    this.commit([item, ...this.state()]);
    this.notifications.add({
      message: `Un nouvel objet « ${item.title} » a été signalé à ${item.location}.`,
      type: 'LOST_FOUND',
      lostFoundId: item.id,
    });
    return item;
  }

  addComment(
    postId: string,
    authorId: string,
    input: LostFoundCommentInput,
  ): LostFoundComment | undefined {
    const target = this.findById(postId);
    const message = input.message.trim();
    if (!target || !message) {
      return undefined;
    }

    const comment: LostFoundComment = {
      id: `lfc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      authorId,
      message,
      createdAt: new Date(),
      taggedUserIds: this.uniqueIds(input.taggedUserIds ?? []),
    };

    this.commit(
      this.state().map((item) =>
        item.id === postId ? { ...item, comments: [...item.comments, comment] } : item,
      ),
    );
    this.notifications.add({
      message: `Nouveau commentaire sur « ${target.title} ».`,
      type: 'LOST_FOUND',
      lostFoundId: postId,
    });
    return comment;
  }

  toggleReaction(postId: string, userId: string): LostFoundItem | undefined {
    const target = this.findById(postId);
    if (!target) {
      return undefined;
    }

    const reacted = target.reactionUserIds.includes(userId);
    const updated: LostFoundItem = {
      ...target,
      reactionUserIds: reacted
        ? target.reactionUserIds.filter((id) => id !== userId)
        : [...target.reactionUserIds, userId],
    };

    this.commit(this.state().map((item) => (item.id === postId ? updated : item)));
    return updated;
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
    const claimed = this.setStatus(id, 'CLAIMED');
    if (claimed) {
      this.notifications.add({
        message: `L'objet « ${claimed.title} » a été réclamé.`,
        type: 'LOST_FOUND',
        lostFoundId: claimed.id,
      });
    }
    return claimed;
  }

  remove(id: string): boolean {
    if (!this.findById(id)) {
      return false;
    }

    this.commit(this.state().filter((item) => item.id !== id));
    return true;
  }

  private uniqueIds(ids: readonly string[]): string[] {
    return [...new Set(ids.filter((id) => !!id))];
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
                taggedUserIds: this.toStringArray(value['taggedUserIds']),
                comments: this.parseComments(value['comments']),
                reactionUserIds: this.toStringArray(value['reactionUserIds']),
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

  private parseComments(value: unknown): LostFoundComment[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((entry) => {
      const comment = entry as Record<string, unknown>;
      return {
        id: String(comment['id']),
        authorId: String(comment['authorId'] ?? DEMO_USER_ID),
        message: String(comment['message'] ?? ''),
        createdAt: new Date(String(comment['createdAt'])),
        taggedUserIds: this.toStringArray(comment['taggedUserIds']),
      } satisfies LostFoundComment;
    });
  }

  private toStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
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
            comments: item.comments.map((comment) => ({
              ...comment,
              createdAt: comment.createdAt.toISOString(),
            })),
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
        taggedUserIds: ['u1'],
        comments: [
          {
            id: 'lfc-1',
            authorId: 'u2',
            message: 'Ahmed, je crois que ce sont les tiennes. Tu peux passer les récupérer au Bloc B ?',
            createdAt: new Date('2026-11-06T09:05:00'),
            taggedUserIds: ['u1'],
          },
          {
            id: 'lfc-2',
            authorId: 'u1',
            message: 'Oui ce sont les miennes, merci beaucoup ! Je passe cet après-midi.',
            createdAt: new Date('2026-11-06T09:20:00'),
            taggedUserIds: [],
          },
        ],
        reactionUserIds: ['u1', 'u3'],
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
        taggedUserIds: [],
        comments: [
          {
            id: 'lfc-3',
            authorId: 'u3',
            message: 'La carte a été déposée à l’accueil de la bibliothèque.',
            createdAt: new Date('2026-11-05T16:10:00'),
            taggedUserIds: ['u1'],
          },
        ],
        reactionUserIds: ['u2'],
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
        taggedUserIds: ['u3'],
        comments: [],
        reactionUserIds: ['u1'],
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
        taggedUserIds: [],
        comments: [],
        reactionUserIds: [],
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
        taggedUserIds: [],
        comments: [
          {
            id: 'lfc-4',
            authorId: 'u2',
            message: 'Contente que tu l’aies retrouvée !',
            createdAt: new Date('2026-11-02T18:00:00'),
            taggedUserIds: [],
          },
        ],
        reactionUserIds: ['u1', 'u2'],
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
        taggedUserIds: ['u1'],
        comments: [],
        reactionUserIds: ['u3'],
      },
    ];
  }
}
