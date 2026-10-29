import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="page not-found">
      <p class="not-found__code">404</p>
      <h1 class="page__title">Page not found</h1>
      <p class="page__hint">The page you are looking for does not exist or has moved.</p>
      <a class="not-found__link" routerLink="/dashboard">Back to dashboard</a>
    </section>
  `,
  styles: `
    .not-found {
      padding: clamp(56px, 14vh, 140px) var(--space-4) var(--space-6);
      text-align: center;
    }

    .not-found__code {
      margin: 0;
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-accent);
      line-height: var(--line-height-tight);
    }

    .not-found__link {
      display: inline-block;
      margin-top: var(--space-4);
      font-weight: var(--font-weight-medium);
    }
  `,
})
export class NotFound {}
