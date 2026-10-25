import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppData } from '../service/app-data';

export const ownerGuard: CanActivateFn = () => {
  const appData = inject(AppData);
  const router = inject(Router);

  if (appData.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
