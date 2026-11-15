import { Component, input, output } from '@angular/core';

/**
 * PB-24 — error surface with an optional retry action.
 *
 * Used when a request fails and there is something the user can do about it,
 * as opposed to `EmptyStateComponent`, which means "nothing here yet".
 */
@Component({
  selector: 'app-error-state',
  template: `
    <div class="error" role="alert">
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      @if (retryable()) {
        <button type="button" class="error__retry" (click)="retry.emit()">
          {{ retryLabel() }}
        </button>
      }
      <ng-content />
    </div>
  `,
  styles: [
    `
      .error {
        padding: var(--space-5) var(--space-4);
        text-align: center;
        color: var(--color-danger);
        background: var(--color-danger-soft);
        border: 1px solid color-mix(in srgb, var(--color-danger) 35%, transparent);
        border-radius: var(--radius-lg);
      }

      h3 {
        margin: 0 0 var(--space-2);
        color: var(--color-danger);
        font-size: var(--font-size-base);
      }

      p {
        margin: 0 0 var(--space-3);
        color: var(--color-text);
      }

      .error__retry {
        padding: var(--space-2) var(--space-4);
        color: var(--color-text-inverse);
        background: var(--color-danger);
        border: 1px solid var(--color-danger);
        border-radius: var(--radius-md);
        cursor: pointer;
      }
    `,
  ],
})
export class ErrorStateComponent {
  title = input('Something went wrong');
  message = input<string>();
  retryable = input(false);
  retryLabel = input('Try again');

  retry = output<void>();
}
