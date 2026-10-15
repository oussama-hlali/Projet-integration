import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Blocks the `/admin/**` area for students and sends them back to the dashboard.
 * Combine with `authGuard` only if a route is reachable while signed out —
 * a student who is signed in still lands on the dashboard here.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
