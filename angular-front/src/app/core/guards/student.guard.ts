import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Keeps administrators inside the `/admin/**` area.
 *
 * Students are the intended audience of the campus pages; an administrator
 * who opens one of those URLs is sent back to the management overview so the
 * two experiences never mix.
 */
export const studentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/admin']);
};
