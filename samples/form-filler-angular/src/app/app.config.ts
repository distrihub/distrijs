import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideDistri } from '@distri/angular';

/**
 * The Angular equivalent of wrapping the app in `<DistriProvider config={...}>`.
 *
 * `@distri/angular` does the auth work: it POSTs the token endpoint, feeds the
 * short-lived token + workspace into the client, and re-mints on expiry. The
 * dev server (see `proxy.conf.cjs`) holds the long-lived DISTRI_API_KEY and
 * exchanges it — the browser only ever sees the short-lived token.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideDistri({ tokenEndpoint: '/api/distri/token' }),
  ],
};
