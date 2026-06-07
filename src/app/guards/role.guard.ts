import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Functional role guard — Angular 15+ standard */
export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRole: string | undefined = route.data['role'];

  // Not logged in → go to homepage
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/homepage']);
  }

  // Admin bypasses all role checks
  if (auth.hasRole('admin')) {
    return true;
  }

  // Wrong role → redirect to homepage (do NOT show the dashboard or unauthorized page)
  if (requiredRole && !auth.hasRole(requiredRole)) {
    return router.createUrlTree(['/homepage']);
  }

  return true;
};