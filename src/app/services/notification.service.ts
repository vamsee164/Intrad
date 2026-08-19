import { Injectable, Inject, PLATFORM_ID, Optional } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Functions, httpsCallable, HttpsCallableResult } from '@angular/fire/functions';
import { FirebaseService } from './firebase.service';

export interface EmailResult {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  constructor(
    @Optional() private readonly functions: Functions | null,
    private readonly firebaseService: FirebaseService,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  /**
   * Send login credentials via email after account creation.
   * Calls the `sendLoginEmail` Firebase Cloud Function (Nodemailer / Gmail SMTP).
   */
  sendLoginCredentialsEmail(
    email: string,
    password: string,
    name: string,
    personalEmail: string
  ): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId) || !this.functions) return of(false);

    const callable = httpsCallable<
      { email: string; password: string; name: string; personalEmail: string },
      EmailResult
    >(this.functions, 'sendLoginEmail');

    return from(callable({ email, password, name, personalEmail })).pipe(
      map((result: HttpsCallableResult<EmailResult>) => {
        const data = result.data;
        if (data?.success) {
          console.log('[NotificationService] Credentials email sent:', data.message);
          return true;
        }
        console.warn('[NotificationService] Credentials email not sent:', data?.message);
        return false;
      }),
      catchError((err: any) => {
        console.error('[NotificationService] sendLoginEmail error:', err?.code, err?.message);
        return of(false);
      })
    );
  }

  /**
   * Trigger a password reset email exclusively to the user's Personal Email / Gmail account.
   * Resolves the user profile first so password reset links are delivered directly to personal Gmail.
   *
   * @param identifier  The registered personal email, system email, or mobile number
   */
  sendPasswordResetEmail(identifier: string): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId) || !identifier) return of(false);

    return this.firebaseService.findUserByIdentifier(identifier).pipe(
      map((user: any) => {
        const personalEmail = user?.personalEmail || user?.email || identifier;
        return personalEmail.trim();
      }),
      catchError(() => of(identifier.trim())),
      switchMap((personalEmail: string) => {
        if (!personalEmail) return of(false);

        console.log('[NotificationService] Requesting password reset email for personal email account:', personalEmail);

        // 1. Try Firebase Auth SDK directly with the personal Gmail account
        return this.firebaseService.sendPasswordResetEmail(personalEmail).pipe(
          map(() => {
            console.log('[NotificationService] Password reset email sent via Firebase Auth SDK to personal email:', personalEmail);
            return true;
          }),
          catchError((authErr: any) => {
            console.warn('[NotificationService] Firebase Auth SDK reset error, sending directly to personal Gmail via Cloud Function:', authErr?.code || authErr?.message);
            if (!this.functions) return of(false);

            // 2. Fall back to Cloud Function (Nodemailer / SMTP) to deliver directly to personal Gmail inbox
            const callable = httpsCallable<
              { email: string },
              EmailResult
            >(this.functions, 'sendForgotPasswordEmail');

            return from(callable({ email: personalEmail })).pipe(
              map((result: HttpsCallableResult<EmailResult>) => !!result.data?.success),
              catchError((fnErr: any) => {
                console.error('[NotificationService] Cloud Function reset error for personal email:', fnErr?.code, fnErr?.message);
                return of(false);
              })
            );
          })
        );
      })
    );
  }
}
