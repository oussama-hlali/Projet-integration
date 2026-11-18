import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshInFlight: Observable<string | null> | null = null;

/**
 * SCRUM-103 — attaches the access token and refreshes it once on a 401,
 * sharing a single refresh call across concurrent requests (single-flight).
 */
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || req.url.includes('/auth/')) {
        return throwError(() => error);
      }

      if (!refreshInFlight) {
        refreshInFlight = auth.refresh();
      }

      return refreshInFlight.pipe(
        take(1),
        switchMap((newToken) => {
          refreshInFlight = null;
          if (!newToken) {
            auth.logout();
            return throwError(() => error);
          }
          auth.accessToken.set(newToken);
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        }),
        catchError((e) => {
          refreshInFlight = null;
          auth.logout();
          return throwError(() => e);
        }),
      );
    }),
  );
}
