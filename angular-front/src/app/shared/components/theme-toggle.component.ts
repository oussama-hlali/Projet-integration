import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

/**
 * Light/dark switch. Small glass pill with a sliding knob; the active icon
 * reflects the current theme and the whole control is a single button.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button
      class="theme-toggle"
      type="button"
      [attr.aria-label]="isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      [attr.title]="isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      (click)="toggle()"
    >
      <span class="theme-toggle__track" [class.theme-toggle__track--dark]="isDark()" aria-hidden="true">
        <svg class="theme-toggle__icon theme-toggle__icon--sun" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </svg>
        <svg class="theme-toggle__icon theme-toggle__icon--moon" viewBox="0 0 24 24">
          <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />
        </svg>
        <span class="theme-toggle__knob"></span>
      </span>
    </button>
  `,
  styles: [
    `
      .theme-toggle {
        display: inline-flex;
        padding: 0;
        background: none;
        border: 0;
        border-radius: var(--radius-full);
        cursor: pointer;
      }

      .theme-toggle__track {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        place-items: center;
        width: 58px;
        height: 30px;
        padding: 3px;
        color: var(--color-text-muted);
        background: color-mix(in srgb, var(--color-surface) 45%, transparent);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
        transition:
          background-color var(--transition-base),
          border-color var(--transition-base);
      }

      .theme-toggle__track:hover {
        border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-border));
      }

      .theme-toggle__icon {
        position: relative;
        z-index: 1;
        width: 14px;
        height: 14px;
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.7;
        transition:
          color var(--transition-base),
          opacity var(--transition-base);
      }

      .theme-toggle__icon--sun {
        color: var(--color-text-strong);
      }

      .theme-toggle__icon--moon {
        opacity: 0.55;
      }

      .theme-toggle__track--dark .theme-toggle__icon--sun {
        color: var(--color-text-muted);
        opacity: 0.55;
      }

      .theme-toggle__track--dark .theme-toggle__icon--moon {
        color: var(--color-accent);
        opacity: 1;
      }

      .theme-toggle__knob {
        position: absolute;
        top: 2px;
        left: 2px;
        z-index: 0;
        width: 24px;
        height: 24px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
        box-shadow: var(--shadow-xs);
        transition: transform var(--transition-slow);
      }

      .theme-toggle__track--dark .theme-toggle__knob {
        transform: translateX(28px);
      }

      .theme-toggle:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 3px;
      }
    `,
  ],
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  protected readonly isDark = this.themeService.isDark;

  protected toggle(): void {
    this.themeService.toggle();
  }
}
