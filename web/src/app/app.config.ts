import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding() ทำให้รับ path param / query param ด้วย input() ได้ (บทเรียน 04)
    provideRouter(routes, withComponentInputBinding()),
  ],
};
