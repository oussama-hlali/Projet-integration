import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  NOTIFICATION_TYPE_LABELS,
  Notification,
  NotificationType,
} from '../../core/models/notification.model';
import { notificationRoute } from '../../core/notification-route';
import { NotificationService } from '../../core/services/notification.service';
import {
  BadgeVariant,
  ConfirmDialogComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
} from '../../shared/components';

@Component({
  selector: 'app-notifications',
  imports: [
    DatePipe,
    RouterLink,
    ConfirmDialogComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  template: `
    <section class="page">
      <app-page-header title="Notifications" [subtitle]="unreadCount() + ' unread'">
        <button
          type="button"
          class="btn"
          [disabled]="unreadCount() === 0"
          (click)="markAllRead()"
        >
          Mark all as read
        </button>
        <button
          type="button"
          class="btn btn--danger"
          [disabled]="notifications().length === 0"
          (click)="confirmOpen.set(true)"
        >
          Clear all
        </button>
      </app-page-header>

      <div class="list">
        @for (notification of notifications(); track notification.id) {
          <article class="item" [class.item--unread]="!notification.read">
            <div class="item__body">
              <div class="item__top">
                <app-status-badge
                  [label]="typeLabels[notification.type]"
                  [variant]="variant(notification.type)"
                />
                <small class="item__date">
                  {{ notification.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </small>
              </div>
              <p class="item__message">
                <a
                  class="item__link"
                  [routerLink]="target(notification)"
                  (click)="markRead(notification)"
                >
                  {{ notification.message }}
                </a>
              </p>
            </div>
            <div class="item__actions">
              <button type="button" class="btn" (click)="toggleRead(notification)">
                {{ notification.read ? 'Mark as unread' : 'Mark as read' }}
              </button>
            </div>
          </article>
        } @empty {
          <app-empty-state title="No notifications" message="You're all caught up." />
        }
      </div>

      <app-confirm-dialog
        [(open)]="confirmOpen"
        title="Clear all notifications"
        message="This will remove all your notifications. Do you want to continue?"
        confirmLabel="Clear all"
        cancelLabel="Cancel"
        [danger]="true"
        (confirmed)="clearAll()"
      />
    </section>
  `,
  styles: `
    .list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .item {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3) var(--space-4);
      padding: var(--space-4) var(--space-5);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-xs);
    }
    .item--unread {
      background: color-mix(in srgb, var(--color-accent) 8%, var(--color-surface));
      border-left: 4px solid var(--color-accent);
    }
    .item__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      flex: 1 1 280px;
    }
    .item__top {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    .item__date {
      color: var(--color-text-muted);
    }
    .item__message {
      margin: 0;
      color: var(--color-text);
    }
    .item__actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    .item__link {
      color: inherit;
      text-decoration: none;
    }
    .item__link:hover,
    .item__link:focus-visible {
      color: var(--color-accent);
      text-decoration: underline;
    }
    .btn {
      padding: var(--space-2) var(--space-4);
      color: var(--color-text);
      background: transparent;
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-md);
      cursor: pointer;
    }
    .btn:hover:not(:disabled) {
      background: color-mix(in srgb, var(--color-text-strong) 8%, transparent);
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn--danger {
      color: var(--color-danger);
      border-color: var(--color-danger);
    }
  `,
})
export class Notifications {
  private readonly service = inject(NotificationService);

  readonly notifications = this.service.notifications;
  readonly unreadCount = this.service.unreadCount;
  readonly confirmOpen = signal(false);
  readonly typeLabels = NOTIFICATION_TYPE_LABELS;

  toggleRead(notification: Notification): void {
    this.service.toggleRead(notification.id);
  }

  markAllRead(): void {
    this.service.markAllRead();
  }

  clearAll(): void {
    for (const notification of this.notifications()) {
      this.service.remove(notification.id);
    }
  }

  variant(type: NotificationType): BadgeVariant {
    if (type === 'ANNOUNCEMENT') return 'info';
    if (type === 'EVENT') return 'success';
    if (type === 'RESERVATION') return 'warning';
    if (type === 'LOST_FOUND') return 'danger';
    return 'neutral';
  }

  target(notification: Notification): string {
    return notificationRoute(notification, 'student');
  }

  markRead(notification: Notification): void {
    if (!notification.read) {
      this.service.markAsRead(notification.id);
    }
  }
}