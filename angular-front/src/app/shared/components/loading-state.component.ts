import { Component, computed, input } from '@angular/core';

/**
 * PB-24 — one loading treatment for the whole app.
 *
 * `spinner` for short waits, `skeleton` for lists whose shape is already known.
 * The live region is announced once, not on every re-render.
 */
@Component({
  selector: 'app-loading-state',
  template: `
    @if (variant() === 'skeleton') {
      <div class="skeletons" role="status" aria-live="polite" [attr.aria-busy]="true">
        <span class="visually-hidden">{{ label() }}</span>
        @for (row of rowsArray(); track row) {
          <div class="skeleton" aria-hidden="true">
            <span class="skeleton__line skeleton__line--title"></span>
            <span class="skeleton__line"></span>
            <span class="skeleton__line skeleton__line--short"></span>
          </div>
        }
      </div>
    } @else {
      <div class="spinner-wrap" role="status" aria-live="polite" [attr.aria-busy]="true">
        <span class="spinner" aria-hidden="true"></span>
        <span class="spinner__label">{{ label() }}</span>
      </div>
    }
  `,
  styles: [
    `
      .spinner-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-6) var(--space-4);
        color: var(--color-text-muted);
      }

      .spinner {
        width: 26px;
        height: 26px;
        border: 3px solid var(--color-border);
        border-top-color: var(--color-accent);
        border-radius: var(--radius-full);
        animation: spin 720ms linear infinite;
      }

      .spinner__label {
        font-size: var(--font-size-sm);
      }

      .skeletons {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .skeleton {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-4) var(--space-5);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
      }

      .skeleton__line {
        height: 12px;
        background: linear-gradient(
          90deg,
          var(--color-surface-muted) 25%,
          color-mix(in srgb, var(--color-surface-muted) 55%, var(--color-border)) 50%,
          var(--color-surface-muted) 75%
        );
        background-size: 240% 100%;
        border-radius: var(--radius-full);
        animation: shimmer 1.4s ease-in-out infinite;
      }

      .skeleton__line--title {
        width: 45%;
        height: 16px;
      }

      .skeleton__line--short {
        width: 70%;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes shimmer {
        from {
          background-position: 120% 0;
        }
        to {
          background-position: -120% 0;
        }
      }
    `,
  ],
})
export class LoadingStateComponent {
  label = input('Loading…');
  variant = input<'spinner' | 'skeleton'>('spinner');
  rows = input(3);

  readonly rowsArray = computed(() => Array.from({ length: Math.max(1, this.rows()) }));
}
