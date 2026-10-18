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
  styles: [`
    .card { display:flex; flex-direction:column; gap:.25rem; padding:1rem 1.25rem;
            border:1px solid #e5e7eb; border-radius:.75rem; background:#fff; }
    .label { font-size:.8rem; color:#6b7280; }
    .value { font-size:1.75rem; }
    .hint { font-size:.75rem; color:#9ca3af; }
  `],
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  hint = input<string>();
}