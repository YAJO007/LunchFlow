import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding() ทำให้รับ query param (เช่น ?job=1001) ผ่าน input() ได้
    provideRouter(routes, withComponentInputBinding()),
  ],
};
