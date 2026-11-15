import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

/**
 * Set on a request to let the caller handle the failure itself, e.g. a form
 * that renders the error inline instead of raising a toast.
 */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

interface ProblemDetails {
  detail?: string;
  message?: string;
  title?: string;
}

function messageFor(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Cannot reach the server. Check your connection and try again.';
  }

  const body = error.error as ProblemDetails | string | null;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    const detail = body.detail ?? body.message ?? body.title;
    if (detail) {
      return detail;
    }
  }

  if (error.status === 401) return 'Your session expired. Please sign in again.';
  if (error.status === 403) return 'You do not have permission to do that.';
  if (error.status === 404) return 'That item could not be found.';
  if (error.status === 409) return 'That action conflicts with the current state.';
  if (error.status === 429) return 'Too many requests. Try again in a moment.';
  if (error.status >= 500) return 'The server ran into a problem. Try again shortly.';

  return 'The request failed. Please try again.';
}

/**
 * PB-24 — turns any failed HTTP call into a single, consistent toast.
 *
 * Wired once in `app.config.ts`; services stay free of error plumbing and only
 * opt out with `context: new HttpContext().set(SKIP_ERROR_TOAST, true)`.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const toast = inject(ToastService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || request.context.get(SKIP_ERROR_TOAST)) {
        return throwError(() => error);
      }

      toast.error(`Request failed (${error.status || 'network'})`, messageFor(error));

      return throwError(() => error);
    }),
  );
};
