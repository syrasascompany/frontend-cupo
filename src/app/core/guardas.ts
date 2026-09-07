import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from './modelos';

export const guardaSesion: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() ? true : inject(Router).createUrlTree(['/entrar']);
};

/** Restringe una ruta a ciertos roles y devuelve a cada quien a lo suyo. */
export const guardaRol = (...permitidos: Rol[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticado()) return router.createUrlTree(['/entrar']);
  if (permitidos.includes(auth.rol()!)) return true;

  return router.createUrlTree([auth.esTrabajadora() ? '/mi-dia' : '/agenda']);
};
