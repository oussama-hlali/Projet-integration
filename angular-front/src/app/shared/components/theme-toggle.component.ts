import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

/**
 * Light/dark switch rendered as a single round icon button: the sun and moon
 * swap with a small rotation. Size follows `--theme-toggle-size`.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button
      class="theme-toggle"
      type="button"
      [class.theme-toggle--dark]="isDark()"
      [attr.aria-label]="isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      [attr.title]="isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      [attr.aria-pressed]="isDark()"
      (click)="toggle()"
    >
      <svg class="theme-toggle__icon theme-toggle__icon--sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"
        />
      </svg>
      <svg class="theme-toggle__icon theme-toggle__icon--moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />
      </svg>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .theme-toggle {
      display: grid;
      place-items: center;
      width: var(--theme-toggle-size, 44px);
      height: var(--theme-toggle-size, 44px);
      padding: 0;
      color: var(--color-text-muted);
      background: transparent;
      border: 0;
      border-radius: var(--radius-full);
      cursor: pointer;
      transition:
        color var(--transition-fast),
        background-color var(--transition-fast),
        transform var(--transition-fast);
    }

    .theme-toggle:hover {
      color: var(--color-text-strong);
      background: var(--well);
    }

    .theme-toggle:active {
      transform: scale(0.94);
    }

    .theme-toggle__icon {
      grid-area: 1 / 1;
      width: calc(var(--theme-toggle-size, 44px) * 0.44);
      height: calc(var(--theme-toggle-size, 44px) * 0.44);
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition:
        opacity 180ms var(--ease-out),
        transform 420ms var(--ease-out);
    }

    .theme-toggle__icon--sun {
      color: var(--color-warning);
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }

    .theme-toggle__icon--moon {
      opacity: 0;
      transform: rotate(-70deg) scale(0.55);
    }

    .theme-toggle--dark .theme-toggle__icon--sun {
      opacity: 0;
      transform: rotate(70deg) scale(0.55);
    }

    .theme-toggle--dark .theme-toggle__icon--moon {
      color: var(--color-accent);
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }
  `,
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  protected readonly isDark = this.themeService.isDark;

  protected toggle(): void {
    this.themeService.toggle();
  }
}
