import { Component, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="variant()">{{ label() }}</span>`,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.18rem 0.6rem;
        font-size: 0.72rem;
        font-weight: var(--font-weight-semibold);
        letter-spacing: 0.02em;
        border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
        border-radius: var(--radius-full);
        background: color-mix(in srgb, currentColor 14%, transparent);
      }

      .success {
        color: var(--color-success);
      }

      .warning {
        color: var(--color-warning);
      }

      .danger {
        color: var(--color-danger);
      }

      .info {
        color: var(--color-info);
      }

      .neutral {
        color: var(--color-text-muted);
        background: color-mix(in srgb, var(--color-text-muted) 12%, transparent);
        border-color: color-mix(in srgb, var(--color-text-muted) 26%, transparent);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  label = input.required<string>();
  variant = input<BadgeVariant>('neutral');
}
