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

  // Handle role checks
  if (requiredRole) {
    const currentRole = auth.getCurrentUser()?.role;

    // Accept 'user' as a legacy alias for 'buyer'
    const effectiveRole = currentRole === 'user' ? 'buyer' : currentRole;

    if (effectiveRole !== requiredRole) {
      // Redirect wrong-role users to their OWN dashboard, not homepage
      const ownDashboard = auth.getDashboardRoute();
      return router.createUrlTree([ownDashboard]);
    }
  }

  return true;
};