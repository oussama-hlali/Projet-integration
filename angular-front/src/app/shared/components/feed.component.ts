import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import {
  Announcement,
  ANNOUNCEMENT_CATEGORY_LABELS,
  AnnouncementCategory,
} from '../../core/models/announcement.model';
import { EmptyStateComponent } from './empty-state.component';
import { BadgeVariant, StatusBadgeComponent } from './status-badge.component';

const CATEGORY_VARIANTS: Record<AnnouncementCategory, BadgeVariant> = {
  GENERAL: 'neutral',
  ACADEMIC: 'info',
  ADMINISTRATIVE: 'warning',
  EVENTS: 'success',
  MAINTENANCE: 'danger',
};

/**
 * Presentational announcement list.
 *
 * The page owns the service data, filters and the local read state, so the
 * same list also works for a future "latest announcements" widget.
 */
@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [DatePipe, StatusBadgeComponent, EmptyStateComponent],
  template: `
    @if (items().length) {
      <ul class="feed">
        @for (item of items(); track item.id) {
          <li
            class="item glass glass--thick"
            [class.item--unread]="!isRead(item.id)"
            [class.item--pinned]="item.pinned"
          >
            <div class="item__head">
              <div class="item__title">
                @if (!isRead(item.id)) {
                  <span class="item__dot" aria-label="Unread"></span>
                }
                <h3>{{ item.title }}</h3>
                @if (item.pinned) {
                  <span class="item__pin">Pinned</span>
                }
              </div>

              <app-status-badge
                [label]="categoryLabel(item.category)"
                [variant]="categoryVariant(item.category)"
              />
            </div>

            <p class="item__content">{{ item.content }}</p>

            <div class="item__meta">
              <time [attr.datetime]="item.publishedAt.toISOString()">
                {{ item.publishedAt | date: 'd MMM yyyy' }}
              </time>

              <button type="button" class="item__action" (click)="readToggled.emit(item.id)">
                {{ isRead(item.id) ? 'Mark as unread' : 'Mark as read' }}
              </button>
            </div>
          </li>
        }
      </ul>
    } @else {
      <app-empty-state
        title="No announcements match these filters"
        message="Try another category or clear the search."
      >
        <ng-content />
      </app-empty-state>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .feed {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .item {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-4);
        border-radius: var(--radius-card);
        transition:
          transform var(--transition-base),
          background-color var(--transition-base);
      }

      .item:hover {
        transform: translateY(-2px);
      }

      .item--pinned {
        box-shadow:
          var(--glass-depth),
          inset 0 0 0 1px color-mix(in srgb, var(--color-warning) 35%, transparent),
          0 22px 44px -24px rgba(16, 24, 40, 0.35);
      }

      .item--unread {
        background:
          linear-gradient(172deg, var(--glass-highlight) 0%, transparent 34%),
          color-mix(in srgb, var(--color-accent-soft) 55%, var(--glass-bg-strong));
      }

      .item__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-3);
      }

      .item__title {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-2);
        min-width: 0;
      }

      .item__title h3 {
        margin: 0;
        color: var(--color-text-strong);
        font-size: 1.02rem;
        font-weight: var(--font-weight-semibold);
        letter-spacing: -0.01em;
      }

      .item__dot {
        flex: 0 0 auto;
        width: 8px;
        height: 8px;
        background: var(--color-accent);
        border-radius: var(--radius-full);
        box-shadow: 0 0 0 3px var(--color-accent-soft);
      }

      .item__pin {
        padding: 0.1rem 0.5rem;
        color: var(--color-warning);
        background: var(--color-warning-soft);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        letter-spacing: 0.02em;
      }

      .item__content {
        margin: 0;
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
        line-height: var(--line-height-base);
      }

      .item__meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        padding-top: var(--space-2);
        border-top: 1px solid var(--color-border);
      }

      .item__meta time {
        color: var(--color-text-muted);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
      }

      .item__action {
        padding: 0.32rem 0.7rem;
        color: var(--color-accent-text);
        background: transparent;
        border: 1px solid color-mix(in srgb, var(--color-accent) 32%, transparent);
        border-radius: var(--radius-full);
        cursor: pointer;
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        transition:
          background-color var(--transition-fast),
          border-color var(--transition-fast);
      }

      .item__action:hover {
        background: var(--color-accent-soft);
        border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
      }

      @media (max-width: 560px) {
        .item__head {
          flex-direction: column;
        }

        .item__meta {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class FeedComponent {
  readonly items = input.required<readonly Announcement[]>();
  readonly readIds = input.required<ReadonlySet<string>>();
  readonly readToggled = output<string>();

  isRead(id: string): boolean {
    return this.readIds().has(id);
  }

  categoryLabel(category: AnnouncementCategory): string {
    return ANNOUNCEMENT_CATEGORY_LABELS[category];
  }

  categoryVariant(category: AnnouncementCategory): BadgeVariant {
    return CATEGORY_VARIANTS[category];
  }
}
