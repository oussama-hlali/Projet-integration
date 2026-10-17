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
  styles: [`
    .empty { text-align:center; padding:3rem 1rem; color:#6b7280; }
    h3 { margin:0 0 .5rem; color:#111827; }
    p { margin:0 0 1rem; }
  `],
})
export class EmptyStateComponent {
  title = input.required<string>();
  message = input<string>();
}