import { Component, computed, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="variant()">{{ label() }}</span>`,
  styles: [`
    .badge { display:inline-block; padding:.2rem .6rem; border-radius:999px;
             font-size:.75rem; font-weight:600; }
    .success { background:#dcfce7; color:#166534; }
    .warning { background:#fef3c7; color:#92400e; }
    .danger  { background:#fee2e2; color:#991b1b; }
    .info    { background:#dbeafe; color:#1e40af; }
    .neutral { background:#f3f4f6; color:#374151; }
  `],
})
export class StatusBadgeComponent {
  label = input.required<string>();
  variant = input<BadgeVariant>('neutral');
}