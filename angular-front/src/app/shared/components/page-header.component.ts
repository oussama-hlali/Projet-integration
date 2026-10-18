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
  styles: [`
    .header { display:flex; justify-content:space-between; align-items:center;
              gap:1rem; margin-bottom:1.5rem; }
    h1 { margin:0; font-size:1.5rem; }
    p { margin:.25rem 0 0; color:#6b7280; }
    .actions { display:flex; gap:.5rem; }
  `],
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
}