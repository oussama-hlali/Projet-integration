import { Injectable, computed, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'smart-campus.theme';

/**
 * UI theme (light / dark), persisted across reloads and applied as
 * `data-theme` on the document root so the token layer can switch.
 *
 * The initial value is read from the tiny bootstrap script in `index.html`,
 * which runs before first paint to avoid a flash of the wrong theme.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeState = signal<Theme>(this.readInitialTheme());

  /** Current theme. */
  readonly theme = this.themeState.asReadonly();

  /** Convenience flag for icon/aria state. */
  readonly isDark = computed(() => this.themeState() === 'dark');

  constructor() {
    this.apply(this.themeState());
  }

  set(theme: Theme): void {
    if (this.themeState() === theme) {
      return;
    }

    this.themeState.set(theme);
    this.persist(theme);
    this.apply(theme);
  }

  toggle(): void {
    this.set(this.themeState() === 'dark' ? 'light' : 'dark');
  }

  private readInitialTheme(): Theme {
    if (typeof document !== 'undefined') {
      const attribute = document.documentElement.dataset['theme'];
      if (attribute === 'light' || attribute === 'dark') {
        return attribute;
      }
    }

    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }

    return 'dark';
  }

  private persist(theme: Theme): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(STORAGE_KEY, theme);
  }

  private apply(theme: Theme): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset['theme'] = theme;
  }
}
