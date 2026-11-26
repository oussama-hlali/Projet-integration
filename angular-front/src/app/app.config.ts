import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { RuntimeConfigService } from './core/config/runtime-config.service';
import { AuthService } from './core/services/auth.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, httpErrorInterceptor])),
    // Order matters: the runtime API base URL must be known before the silent
    // cookie refresh runs, otherwise the bootstrap may call a stale host.
    provideAppInitializer(async () => {
      // Resolve both services synchronously: inject() is only valid inside the
      // initializer's injection context, before the first await.
      const config = inject(RuntimeConfigService);
      const auth = inject(AuthService);
      await config.load();
      await auth.init();
    }),
  ],
};
