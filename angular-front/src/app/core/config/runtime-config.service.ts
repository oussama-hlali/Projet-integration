import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * SCRUM-102 — runtime configuration.
 *
 * The API base URL is baked into the build via `environment.ts`, but Vercel can
 * override it at runtime by serving `/config.json` (see `public/config.json`).
 * We load it once during app init so the rest of the app reads a single signal.
 */
@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  readonly apiBaseUrl = signal(environment.apiBaseUrl);

  constructor(private readonly http: HttpClient) {}

  load(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<{ apiBaseUrl?: string }>('/config.json').subscribe({
        next: (cfg) => {
          if (cfg?.apiBaseUrl) this.apiBaseUrl.set(cfg.apiBaseUrl);
          resolve();
        },
        error: () => resolve(), // keep the build-time default
      });
    });
  }
}
