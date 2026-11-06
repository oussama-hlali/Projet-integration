import { Component, computed, signal } from '@angular/core';
import { FeedCategory, FeedItem } from '../../core/models/feed-item.model';
import { EmptyStateComponent } from './empty-state.component';
import { PageHeaderComponent } from './page-header.component';
import { StatusBadgeComponent } from './status-badge.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [StatusBadgeComponent, EmptyStateComponent, PageHeaderComponent],
  template: `
    <app-page-header title="Fil d'actualité" [subtitle]="unreadCount() + ' non lu(s)'">
      <button type="button" (click)="markAllRead()" [disabled]="!unreadCount()">
        Tout marquer comme lu
      </button>
    </app-page-header>

    <div class="tabs">
      <button type="button" [class.active]="category() === ''" (click)="category.set('')">Tout</button>
      @for (c of categories; track c) {
        <button type="button" [class.active]="category() === c" (click)="category.set(c)">{{ c }}</button>
      }
      <label class="unread-only">
        <input type="checkbox" [checked]="unreadOnly()" (change)="unreadOnly.set(!unreadOnly())" />
        Non lus seulement
      </label>
    </div>

    @if (visible().length) {
      <ul class="feed">
        @for (item of visible(); track item.id) {
          <li class="item" [class.unread]="!item.read" [class.pinned]="item.pinned">
            <div class="head">
              <h3>
                @if (item.pinned) { 📌 }
                {{ item.title }}
              </h3>
              <app-status-badge [label]="item.category" variant="info" />
            </div>
            <p>{{ item.content }}</p>
            <small>{{ item.date }}</small>
            <div class="actions">
              <button type="button" (click)="toggleRead(item.id)">
                {{ item.read ? 'Marquer non lu' : 'Marquer lu' }}
              </button>
              <button type="button" (click)="togglePin(item.id)">
                {{ item.pinned ? 'Désépingler' : 'Épingler' }}
              </button>
            </div>
          </li>
        }
      </ul>
    } @else {
      <app-empty-state title="Aucun élément" message="Rien à afficher pour ce filtre." />
    }
  `,
  styles: [`
    .tabs { display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; margin-bottom:1rem; }
    .tabs button { padding:.35rem .8rem; border:1px solid #d1d5db; border-radius:999px; background:#fff; cursor:pointer; }
    .tabs button.active { background:#111827; color:#fff; border-color:#111827; }
    .unread-only { margin-left:auto; font-size:.85rem; }
    .feed { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.75rem; }
    .item { border:1px solid #e5e7eb; border-radius:.75rem; padding:1rem; background:#fff; }
    .item.unread { border-left:4px solid #2563eb; background:#f8fafc; }
    .item.pinned { border-color:#f59e0b; }
    .head { display:flex; justify-content:space-between; align-items:center; gap:.5rem; }
    h3 { margin:0; font-size:1rem; }
    .item.unread h3 { font-weight:700; }
    .item:not(.unread) h3 { font-weight:500; color:#6b7280; }
    .actions { display:flex; gap:.5rem; margin-top:.5rem; }
  `],
})
export class FeedComponent {
  categories: FeedCategory[] = ['Annonces', 'Examens', 'Événements', 'Administration'];

  items = signal<FeedItem[]>([
    { id: 1, title: 'Calendrier des examens', content: 'Le planning est disponible.', category: 'Examens', date: '2026-11-05', pinned: true, read: false },
    { id: 2, title: 'Journée portes ouvertes', content: 'Samedi à 9h au bloc A.', category: 'Événements', date: '2026-11-04', pinned: false, read: false },
    { id: 3, title: 'Fermeture administrative', content: 'Le service sera fermé vendredi.', category: 'Administration', date: '2026-11-02', pinned: false, read: true },
  ]);

  category = signal<FeedCategory | ''>('');
  unreadOnly = signal(false);

  unreadCount = computed(() => this.items().filter(i => !i.read).length);

  visible = computed(() => {
    const c = this.category();
    const onlyUnread = this.unreadOnly();

    return this.items()
      .filter(i => (!c || i.category === c) && (!onlyUnread || !i.read))
      .sort((a, b) =>
        Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date)
      );
  });

  toggleRead(id: number) {
    this.items.update(list => list.map(i => i.id === id ? { ...i, read: !i.read } : i));
  }

  togglePin(id: number) {
    this.items.update(list => list.map(i => i.id === id ? { ...i, pinned: !i.pinned } : i));
  }

  markAllRead() {
    this.items.update(list => list.map(i => ({ ...i, read: true })));
  }
}