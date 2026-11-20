import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  /** Compiled-in default (environment.prod.ts points at the deployed gateway). */
  readonly apiBaseUrl = signal(environment.apiBaseUrl);

  constructor(private readonly http: HttpClient) {}

  load(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<{ apiBaseUrl?: string }>('/config.json').subscribe({
        next: (cfg) => {
          const url = cfg?.apiBaseUrl;
          // A stale localhost config must never redirect a production build away
          // from the deployed gateway.
          if (url && !(environment.production && url.includes('localhost'))) {
            this.apiBaseUrl.set(url);
          }
          resolve();
        },
        error: () => resolve(),
      });
    });
  }
}
