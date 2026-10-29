import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="card glass glass--thick">
      <span class="label">{{ label() }}</span>
      <strong class="value">{{ value() }}</strong>
      @if (hint()) {
        <span class="hint">{{ hint() }}</span>
      }
    </div>
  `,
  styles: [
    `
      .card {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        padding: var(--space-4) var(--space-5);
        border-radius: var(--radius-tile);
        transition:
          transform var(--transition-base),
          background-color var(--transition-base);
      }

      .card:hover {
        transform: translateY(-3px);
      }

      .label {
        color: var(--color-text-muted);
        font-size: 0.68rem;
        font-weight: var(--font-weight-semibold);
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .value {
        color: var(--color-text-strong);
        font-size: 2rem;
        font-weight: var(--font-weight-semibold);
        line-height: 1.1;
        letter-spacing: -0.03em;
      }

      .hint {
        color: var(--color-text-muted);
        font-size: var(--font-size-xs);
      }
    `,
  ],
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  hint = input<string>();
}
