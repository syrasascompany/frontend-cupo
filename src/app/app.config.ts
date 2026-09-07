import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';

import { rutas } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';

registerLocaleData(localeEsCo, 'es-CO');

export const configuracionApp: ApplicationConfig = {
  providers: [
    provideRouter(rutas, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CO' }
  ]
};
