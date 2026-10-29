import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="card">
      <span class="label">{{ label() }}</span>
      <strong class="value">{{ value() }}</strong>
      @if (hint()) { <span class="hint">{{ hint() }}</span> }
    </div>
  `,
  styles: [
    `
      .card {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        padding: var(--space-4) var(--space-5);
        background-color: var(--glass-bg);
        background-image: linear-gradient(180deg, var(--glass-highlight), transparent 42%);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--glass-shadow);
        backdrop-filter: blur(18px) saturate(140%);
        -webkit-backdrop-filter: blur(18px) saturate(140%);
        transition:
          transform var(--transition-fast),
          border-color var(--transition-fast),
          background-color var(--transition-base);
      }

      .card:hover {
        transform: translateY(-2px);
        border-color: color-mix(in srgb, var(--color-accent) 34%, var(--glass-border));
      }

      .label {
        color: var(--color-text-muted);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .value {
        color: var(--color-text-strong);
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-semibold);
        line-height: 1.1;
        letter-spacing: -0.02em;
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
