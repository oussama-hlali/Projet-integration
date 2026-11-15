import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  /** Monotonic id so the host can track items without relying on content. */
  readonly id: number;
  readonly tone: ToastTone;
  readonly title: string;
  readonly message?: string;
  readonly durationMs: number;
}

/** How long a toast stays on screen unless the user dismisses it first. */
const DEFAULT_DURATION_MS = 5_000;

/** Never stack more than this; the oldest toast leaves the screen first. */
const MAX_VISIBLE = 4;

/**
 * PB-24 — single source of truth for feedback messages.
 *
 * Pages call `toast.success(...)` after a mutation instead of rendering their
 * own inline banner, so every confirmation looks the same and disappears on
 * its own. The host component is mounted once in the app shell.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<readonly Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;

  /** Read-only view consumed by the toast host. */
  readonly toasts = this.items.asReadonly();

  success(title: string, message?: string, durationMs = DEFAULT_DURATION_MS): number {
    return this.show('success', title, message, durationMs);
  }

  error(title: string, message?: string, durationMs = DEFAULT_DURATION_MS + 3_000): number {
    return this.show('error', title, message, durationMs);
  }

  warning(title: string, message?: string, durationMs = DEFAULT_DURATION_MS): number {
    return this.show('warning', title, message, durationMs);
  }

  info(title: string, message?: string, durationMs = DEFAULT_DURATION_MS): number {
    return this.show('info', title, message, durationMs);
  }

  show(tone: ToastTone, title: string, message?: string, durationMs = DEFAULT_DURATION_MS): number {
    const id = ++this.nextId;
    const toast: Toast = { id, tone, title, message, durationMs };

    this.items.update((current) => {
      const next = [...current, toast];
      while (next.length > MAX_VISIBLE) {
        const dropped = next.shift();
        if (dropped) {
          this.clearTimer(dropped.id);
        }
      }
      return next;
    });

    // 0 disables the timer, which keeps unit tests deterministic.
    if (durationMs > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), durationMs),
      );
    }

    return id;
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.items.update((current) => current.filter((toast) => toast.id !== id));
  }

  clear(): void {
    for (const id of this.timers.keys()) {
      this.clearTimer(id);
    }
    this.items.set([]);
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
