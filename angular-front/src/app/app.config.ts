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
    // Resolve both services synchronously: inject() is only valid inside the
    // initializer's injection context. Neither promise is awaited here, so the
    // splash paints immediately; guards and login wait on `auth.ready`.
    provideAppInitializer(() => {
      const config = inject(RuntimeConfigService);
      const auth = inject(AuthService);
      auth.init(config.load());
    }),
  ],
};
