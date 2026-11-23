import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, defer, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';

import { RuntimeConfigService } from '../config/runtime-config.service';
import {
  ANNOUNCEMENT_CATEGORIES,
  Announcement,
  AnnouncementCategory,
} from '../models/announcement.model';

export interface AnnouncementInput {
  title: string;
  content: string;
  category: AnnouncementCategory;
  pinned: boolean;
  authorId?: string;
}

interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  authorId?: string | null;
  createdAt: string;
}

/**
 * Supabase-backed announcement store. All pages read the same signal so an
 * administrator's change is reflected immediately. The campus service owns the
 * `campus.announcements` table; the gateway routes `/announcements/**` to it.
 */
@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private readonly state = signal<Announcement[]>([]);

  readonly announcements = this.state.asReadonly();

  /**
   * One shared request starts when the service is first injected. Components
   * that call `getAnnouncements()` receive the replayed result.
   */
  private readonly loaded$ = defer(() =>
    this.http.get<AnnouncementDto[]>(this.baseUrl()),
  ).pipe(
    map((rows) => rows.map((row) => this.fromDto(row))),
    tap((rows) => this.state.set(rows)),
    catchError(() => of([] as Announcement[])),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  constructor() {
    this.loaded$.subscribe();
  }

  getAnnouncements(): Observable<Announcement[]> {
    return this.loaded$;
  }

  getAnnouncementById(id: string): Observable<Announcement | undefined> {
    return of(this.state().find((announcement) => announcement.id === id));
  }

  findByTitle(title: string): Announcement | undefined {
    return this.state().find((announcement) => announcement.title === title);
  }

  create(input: AnnouncementInput): Observable<Announcement> {
    const payload: Record<string, unknown> = {
      title: input.title.trim(),
      body: input.content.trim(),
      category: input.category,
      pinned: input.pinned,
    };
    if (input.authorId) {
      payload['authorId'] = input.authorId;
    }
    return this.http.post<AnnouncementDto>(this.baseUrl(), payload).pipe(
      map((row) => this.fromDto(row)),
      tap((created) => this.state.update((items) => [created, ...items])),
    );
  }

  update(id: string, changes: Partial<AnnouncementInput>): Observable<Announcement> {
    const payload: Record<string, unknown> = {};
    if (changes.title !== undefined) payload['title'] = changes.title.trim();
    if (changes.content !== undefined) payload['body'] = changes.content.trim();
    if (changes.category !== undefined) payload['category'] = changes.category;
    if (changes.pinned !== undefined) payload['pinned'] = changes.pinned;
    if (changes.authorId !== undefined) payload['authorId'] = changes.authorId;

    return this.http.put<AnnouncementDto>(`${this.baseUrl()}/${id}`, payload).pipe(
      map((row) => this.fromDto(row)),
      tap((updated) =>
        this.state.update((items) =>
          items.map((announcement) => (announcement.id === id ? updated : announcement)),
        ),
      ),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl()}/${id}`).pipe(
      tap(() => this.state.update((items) => items.filter((announcement) => announcement.id !== id))),
    );
  }

  private baseUrl(): string {
    return `${this.cfg.apiBaseUrl()}/announcements`;
  }

  private fromDto(row: AnnouncementDto): Announcement {
    const category = ANNOUNCEMENT_CATEGORIES.includes(row.category as AnnouncementCategory)
      ? (row.category as AnnouncementCategory)
      : 'GENERAL';
    return {
      id: row.id,
      title: row.title,
      content: row.body,
      publishedAt: new Date(row.createdAt),
      category,
      pinned: row.pinned,
      authorId: row.authorId ?? '',
    };
  }
}
