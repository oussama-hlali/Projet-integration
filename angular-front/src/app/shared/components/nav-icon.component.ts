import { Component, input } from '@angular/core';
import { NavIconName } from '../../core/navigation';

/**
 * Minimal stroke icon set used by the shell chrome.
 *
 * Size comes from the `--nav-icon-size` custom property so the icon adapts to
 * whichever rail it sits in (tab, dock button, header tool).
 */
@Component({
  selector: 'app-nav-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      @switch (name()) {
        @case ('dashboard') {
          <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />
        }
        @case ('rooms') {
          <path
            d="M4 20V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v15M3 20h18M7 8h3m-3 4h3m4-4h3m-3 4h3M8 20v-4h8v4"
          />
        }
        @case ('calendar') {
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4m8-4v4M4 10h16M8 14h2m2 0h2m-6 3h2" />
        }
        @case ('events') {
          <path d="M12 3 14.5 9.5 21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
        }
        @case ('megaphone') {
          <path d="m4 13 12 4V7L4 11v2Zm12 4 3 2V5l-3 2M7 14l1.5 5H12l-1.5-4.5" />
        }
        @case ('transport') {
          <path
            d="M5 17h14l-1-8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2l-1 8Zm2 0v2m10-2v2M7 12h10M8 15h.01m8 0h.01"
          />
        }
        @case ('cafeteria') {
          <path d="M6 3v8a3 3 0 0 0 3 3V3m-3 5h6M9 14v7m8-18v18m0-18c3 2 3 5 0 7" />
        }
        @case ('search') {
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        }
        @case ('bell') {
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
        }
        @case ('user') {
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        }
        @case ('admin') {
          <path d="M12 3 5 6v5.5c0 4.4 2.9 8 7 9.5 4.1-1.5 7-5.1 7-9.5V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        }
        @case ('logout') {
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      width: var(--nav-icon-size, 20px);
      height: var(--nav-icon-size, 20px);
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class NavIconComponent {
  readonly name = input.required<NavIconName>();
}
