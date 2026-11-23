import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../config/runtime-config.service';
import {
  LostFoundComment,
  LostFoundCommentInput,
  LostFoundItem,
  LostFoundReportInput,
  LostFoundStatus,
} from '../models/lost-found.model';
import { mapLostFound, mapLostFoundComment } from './live-mappers';
import { NotificationService } from './notification.service';

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
  private readonly http = inject(HttpClient, { optional: true });
  private readonly cfg = inject(RuntimeConfigService, { optional: true });
  private readonly state = signal<LostFoundItem[]>(environment.useMocks ? this.load() : []);

  constructor() {
    if (!environment.useMocks) {
      this.http!.get<any[]>(`${this.apiBase()}/lost-found`).subscribe({
        next: (rows) => this.commit(rows.map(mapLostFound)),
        error: () => {},
      });
    }
  }

  private apiBase(): string {
    return this.cfg!.apiBaseUrl();
  }

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
    const notify = (id: string): void => {
      this.notifications.add({
        message: `Un nouvel objet « ${item.title} » a été signalé à ${item.location}.`,
        type: 'LOST_FOUND',
        lostFoundId: id,
      });
    };

    if (!environment.useMocks) {
      this.http!.post<any>(`${this.apiBase()}/lost-found`, {
        title: item.title,
        description: item.description,
        status: item.status,
        location: item.location,
        category: item.category,
        contactPhone: item.contactPhone,
        reporterId,
        taggedUserIds: item.taggedUserIds,
      }).subscribe({
        next: (row) => {
          const saved = mapLostFound(row);
          this.replace(item.id, saved);
          notify(saved.id);
        },
        error: () => this.commit(this.state().filter((candidate) => candidate.id !== item.id)),
      });
    } else {
      notify(item.id);
    }
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
    const notify = (): void => {
      this.notifications.add({
        message: `Nouveau commentaire sur « ${target.title} ».`,
        type: 'LOST_FOUND',
        lostFoundId: postId,
      });
    };

    if (!environment.useMocks) {
      this.http!.post<any>(`${this.apiBase()}/lost-found/${postId}/comments`, {
        authorId,
        message,
        taggedUserIds: comment.taggedUserIds,
      }).subscribe({
        next: (row) => {
          const saved = mapLostFoundComment(row);
          this.replaceComment(postId, comment.id, saved);
          notify();
        },
        error: () => this.replaceComment(postId, comment.id, null),
      });
    } else {
      notify();
    }
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
    if (!environment.useMocks) {
      const request = reacted
        ? this.http!.delete(`${this.apiBase()}/lost-found/${postId}/reactions/me?userId=${userId}`)
        : this.http!.put(`${this.apiBase()}/lost-found/${postId}/reactions/me?userId=${userId}`, {});
      request.subscribe({
        next: () => {
          this.http!.get<any>(`${this.apiBase()}/lost-found/${postId}`).subscribe({
            next: (row) => this.replace(postId, mapLostFound(row)),
            error: () => {},
          });
        },
        error: () => this.replace(postId, target),
      });
    }
    return updated;
  }

  setStatus(id: string, status: LostFoundStatus): LostFoundItem | undefined {
    const target = this.findById(id);
    if (!target) {
      return undefined;
    }

    const updated: LostFoundItem = { ...target, status };
    this.commit(this.state().map((item) => (item.id === id ? updated : item)));
    if (!environment.useMocks) {
      this.http!.patch<any>(`${this.apiBase()}/lost-found/${id}`, { status }).subscribe({
        next: (row) => this.replace(id, mapLostFound(row)),
        error: () => this.replace(id, target),
      });
    }
    return updated;
  }

  claim(id: string): LostFoundItem | undefined {
    const target = this.findById(id);
    if (!target) {
      return undefined;
    }

    if (!environment.useMocks) {
      // Claim has its own endpoint so the backend can enforce the LOST/FOUND
      // transition in one transaction.
      const optimistic: LostFoundItem = { ...target, status: 'CLAIMED' };
      this.replace(id, optimistic);
      this.http!.post<any>(`${this.apiBase()}/lost-found/${id}/claim`, {}).subscribe({
        next: (row) => {
          const saved = mapLostFound(row);
          this.replace(id, saved);
          this.notifications.add({
            message: `L'objet « ${saved.title} » a été réclamé.`,
            type: 'LOST_FOUND',
            lostFoundId: saved.id,
          });
        },
        error: () => this.replace(id, target),
      });
      return optimistic;
    }

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
    const target = this.findById(id);
    if (!target) {
      return false;
    }

    this.commit(this.state().filter((item) => item.id !== id));
    if (!environment.useMocks) {
      this.http!.delete(`${this.apiBase()}/lost-found/${id}`).subscribe({
        error: () => this.commit([target, ...this.state()]),
      });
    }
    return true;
  }

  private uniqueIds(ids: readonly string[]): string[] {
    return [...new Set(ids.filter((id) => !!id))];
  }

  private commit(items: LostFoundItem[]): void {
    this.state.set(items);
  }

  private replace(id: string, item: LostFoundItem): void {
    this.commit(this.state().map((candidate) => (candidate.id === id ? item : candidate)));
  }

  /** Replace a temp comment with the backend row; `null` removes it on failure. */
  private replaceComment(postId: string, commentId: string, saved: LostFoundComment | null): void {
    this.commit(
      this.state().map((item) => {
        if (item.id !== postId) return item;
        const comments = saved
          ? item.comments.map((comment) => (comment.id === commentId ? saved : comment))
          : item.comments.filter((comment) => comment.id !== commentId);
        return { ...item, comments };
      }),
    );
  }

  private load(): LostFoundItem[] {
    return this.seed();
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
