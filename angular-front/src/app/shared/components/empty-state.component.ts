import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty">
      <h3>{{ title() }}</h3>
      @if (message()) { <p>{{ message() }}</p> }
      <ng-content />
    </div>
  `,
  styles: [
    `
      .empty {
        padding: var(--space-5) var(--space-4);
        color: var(--color-text-muted);
        text-align: center;
        background: color-mix(in srgb, var(--color-surface) 32%, transparent);
        border: 1px dashed var(--color-border-strong);
        border-radius: var(--radius-lg);
      }

      h3 {
        margin: 0 0 var(--space-2);
        color: var(--color-text-strong);
        font-size: var(--font-size-base);
      }

      p {
        margin: 0 0 var(--space-3);
      }
    `,
  ],
})
export class EmptyStateComponent {
  title = input.required<string>();
  message = input<string>();
}
