import { Component, inject } from '@angular/core';
import { ToastService, ToastTone } from '../../core/services/toast.service';

const TONE_ICONS: Record<ToastTone, string> = {
  success: '✓',
  error: '!',
  warning: '!',
  info: 'i',
};

/**
 * PB-24 — renders the global toast stack.
 *
 * Mounted once in the app shell. Success and info go through a polite live
 * region; errors use `role="alert"` so a screen reader interrupts.
 */
@Component({
  selector: 'app-toast-host',
  template: `
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (toast of toasts(); track toast.id) {
        <div
          class="toast glass glass--thick"
          [class]="'toast toast--' + toast.tone"
          [attr.role]="toast.tone === 'error' ? 'alert' : 'status'"
        >
          <span class="toast__icon" aria-hidden="true">{{ icon(toast.tone) }}</span>

          <div class="toast__body">
            <p class="toast__title">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="toast__message">{{ toast.message }}</p>
            }
          </div>

          <button
            type="button"
            class="toast__close"
            aria-label="Dismiss notification"
            (click)="dismiss(toast.id)"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toasts {
        position: fixed;
        right: var(--space-4);
        bottom: var(--space-4);
        z-index: var(--z-toast);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        width: min(380px, calc(100vw - var(--space-4) * 2));
        pointer-events: none;
      }

      .toast {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        color: var(--color-text);
        border-left: 4px solid var(--color-border-strong);
        border-radius: var(--radius-md);
        pointer-events: auto;
        animation: toast-in 220ms var(--ease-out) both;
      }

      .toast--success {
        border-left-color: var(--color-success);
      }

      .toast--error {
        border-left-color: var(--color-danger);
      }

      .toast--warning {
        border-left-color: var(--color-warning);
      }

      .toast--info {
        border-left-color: var(--color-info);
      }

      .toast__icon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 22px;
        height: 22px;
        margin-top: 2px;
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-inverse);
        background: var(--color-border-strong);
        border-radius: var(--radius-full);
      }

      .toast--success .toast__icon {
        background: var(--color-success);
      }

      .toast--error .toast__icon {
        background: var(--color-danger);
      }

      .toast--warning .toast__icon {
        background: var(--color-warning);
      }

      .toast--info .toast__icon {
        background: var(--color-info);
      }

      .toast__body {
        flex: 1 1 auto;
        min-width: 0;
      }

      .toast__title {
        margin: 0;
        color: var(--color-text-strong);
        font-weight: var(--font-weight-semibold);
      }

      .toast__message {
        margin: var(--space-1) 0 0;
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .toast__close {
        flex: 0 0 auto;
        width: 28px;
        height: 28px;
        padding: 0;
        color: var(--color-text-muted);
        font-size: var(--font-size-lg);
        line-height: 1;
        background: transparent;
        border: 0;
        border-radius: var(--radius-sm);
        cursor: pointer;
      }

      .toast__close:hover {
        color: var(--color-text-strong);
        background: var(--well);
      }

      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }

      @media (max-width: 480px) {
        .toasts {
          right: var(--space-3);
          left: var(--space-3);
          bottom: var(--space-3);
          width: auto;
        }
      }
    `,
  ],
})
export class ToastHostComponent {
  private readonly service = inject(ToastService);

  readonly toasts = this.service.toasts;

  icon(tone: ToastTone): string {
    return TONE_ICONS[tone];
  }

  dismiss(id: number): void {
    this.service.dismiss(id);
  }
}
