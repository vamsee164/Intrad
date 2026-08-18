import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth, connectAuthEmulator } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { routes } from './app.routes';
import { firebaseConfig } from '../environments/firebase.config';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withFetch()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),

    provideAuth(() => {
      const auth = getAuth();
      // ── Development: connect to Auth Emulator (no reCAPTCHA, no real SMS) ──
      // Production: useAuthEmulator = false  →  uses real Firebase Phone Auth
      if (environment.useAuthEmulator) {
        connectAuthEmulator(auth, environment.authEmulatorUrl, {
          disableWarnings: false   // keep the "⚠ Auth Emulator" banner visible so you know you're in dev mode
        });
        console.warn('[DEV] 🔧 Firebase Auth Emulator connected at', environment.authEmulatorUrl);
      }
      return auth;
    }),

    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    provideFunctions(() => getFunctions(undefined, 'asia-south1'))
  ]
};
