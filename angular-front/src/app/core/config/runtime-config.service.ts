import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  readonly apiBaseUrl = signal(DEFAULT_API_BASE_URL);

  constructor(private readonly http: HttpClient) {}

  load(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<{ apiBaseUrl?: string }>('/config.json').subscribe({
        next: (cfg) => {
          if (cfg?.apiBaseUrl) this.apiBaseUrl.set(cfg.apiBaseUrl);
          resolve();
        },
        error: () => resolve(),
      });
    });
  }
}
