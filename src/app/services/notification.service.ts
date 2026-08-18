import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Functions, httpsCallable, HttpsCallableResult } from '@angular/fire/functions';

export interface EmailResult {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  constructor(
    private readonly functions: Functions,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  /**
   * Send login credentials via email after account creation.
   * Calls the `sendLoginEmail` Firebase Cloud Function (Nodemailer / Gmail SMTP).
   *
   * @param email          The auto-generated @intra-d.com login email
   * @param password       The generated password
   * @param name           The user's full name
   * @param personalEmail  The user's personal email to send credentials to
   */
  sendLoginCredentialsEmail(
    email: string,
    password: string,
    name: string,
    personalEmail: string
  ): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) return of(false);

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
        // Non-critical — do NOT block user flow on email failure
        return of(false);
      })
    );
  }

  /**
   * Trigger a Firebase Auth password reset email to the registered address.
   * Calls the `sendForgotPasswordEmail` Firebase Cloud Function.
   * The Cloud Function generates the reset link and emails it.
   *
   * @param email  The registered @intra-d.com email address
   */
  sendPasswordResetEmail(email: string): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) return of(false);

    const callable = httpsCallable<
      { email: string },
      EmailResult
    >(this.functions, 'sendForgotPasswordEmail');

    return from(callable({ email })).pipe(
      map((result: HttpsCallableResult<EmailResult>) => {
        const data = result.data;
        if (data?.success) {
          console.log('[NotificationService] Password reset email sent:', data.message);
          return true;
        }
        console.warn('[NotificationService] Password reset email not sent:', data?.message);
        return false;
      }),
      catchError((err: any) => {
        console.error('[NotificationService] sendForgotPasswordEmail error:', err?.code, err?.message);
        return of(false);
      })
    );
  }
}
