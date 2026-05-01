import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services';
import { UserRole } from '../../interfaces';

const roleGuard = (expectedRole: UserRole): CanActivateFn => async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!authService.isAuthenticated() || !user) {
    return router.parseUrl('/login');
  }

  if (!user.is_active) {
    await authService.signOut('/login');
    return false;
  }

  if (user.role !== expectedRole) {
    return router.parseUrl(user.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard');
  }

  return true;
};

export const adminGuard = roleGuard('ADMIN');
export const clientGuard = roleGuard('CLIENT');
