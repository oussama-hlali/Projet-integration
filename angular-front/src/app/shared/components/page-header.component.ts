import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="header">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) { <p>{{ subtitle() }}</p> }
      </div>
      <div class="actions"><ng-content /></div>
    </header>
  `,
  styles: [
    `
      .header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: var(--space-4);
        margin-bottom: var(--space-5);
      }

      h1 {
        margin: 0;
        color: var(--color-text-strong);
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-semibold);
        letter-spacing: -0.02em;
      }

      p {
        margin: var(--space-1) 0 0;
        color: var(--color-text-muted);
      }

      .actions {
        display: flex;
        gap: var(--space-2);
      }

      @media (max-width: 480px) {
        .header {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
