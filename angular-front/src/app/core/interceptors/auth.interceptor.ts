import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshInFlight: Observable<string | null> | null = null;

/**
 * SCRUM-103 — attaches the in-memory access token, keeps every gateway call
 * credentialed (so the HttpOnly refresh cookie replay works), and refreshes
 * once on a 401. Concurrent 401s share one refresh call.
 */
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  const credentialed = req.clone({ withCredentials: true });
  const authed = token
    ? credentialed.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : credentialed;

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
          return next(
            credentialed.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }),
          );
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
