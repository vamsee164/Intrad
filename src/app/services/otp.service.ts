import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Auth } from '@angular/fire/auth';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OtpService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;
  private containerId = 'recaptcha-container-signup';

  private get isEmulator(): boolean {
    return !!(environment as any).useAuthEmulator;
  }

  constructor(
    private auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // ─────────────────────────────────────────────────────────────
  //  reCAPTCHA
  // ─────────────────────────────────────────────────────────────

  initRecaptcha(containerId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.isEmulator) return; // emulator needs no reCAPTCHA
    if (this.recaptchaVerifier) return; // already ready

    this.containerId = containerId;
    const containerEl = document.getElementById(containerId);
    if (!containerEl) {
      console.error(`[OTP] #${containerId} not found. Must NOT be inside *ngIf.`);
      return;
    }

    // Clear any old widget HTML so re-render doesn't conflict
    containerEl.innerHTML = '';

    try {
      this.recaptchaVerifier = new RecaptchaVerifier(
        this.auth,
        containerEl,
        {
          size: 'invisible',
          callback: () => console.log('[OTP] reCAPTCHA token obtained'),
          'expired-callback': () => {
            console.warn('[OTP] reCAPTCHA expired');
            this.resetRecaptcha();
          }
        }
      );
      console.log('[OTP] reCAPTCHA initialised on #' + containerId);
    } catch (err: any) {
      console.error('[OTP] reCAPTCHA init error:', err?.code, err?.message);
      this.recaptchaVerifier = null;
    }
  }

  /**
   * Clears the verifier AND the container innerHTML so a fresh widget
   * can be rendered on the next initRecaptcha() call.
   */
  resetRecaptcha(): void {
    if (this.recaptchaVerifier) {
      try { this.recaptchaVerifier.clear(); } catch { /* ignore */ }
      this.recaptchaVerifier = null;
    }
    // Clear stale widget HTML from the container
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById(this.containerId);
      if (el) el.innerHTML = '';
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  Send OTP
  // ─────────────────────────────────────────────────────────────

  sendOtp(mobileNumber: string): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) return of(false);

    const clean = this.cleanMobileNumber(mobileNumber);
    if (!this.isValidIndianMobile(clean)) {
      console.error('[OTP] Invalid mobile number:', mobileNumber);
      return of(false);
    }

    const phoneNumber = `+91${clean}`;
    console.log('[OTP] Sending OTP to', phoneNumber, this.isEmulator ? '(EMULATOR)' : '(LIVE)');

    // ── Emulator path ──────────────────────────────────────────
    if (this.isEmulator) {
      const dummyVerifier = {
        type: 'recaptcha' as const,
        verify: () => Promise.resolve('emulator-bypass-token'),
        _reset: () => {},
        _destroy: () => {}
      };
      return from(signInWithPhoneNumber(this.auth, phoneNumber, dummyVerifier)).pipe(
        map((result: ConfirmationResult) => {
          this.confirmationResult = result;
          console.log('[OTP] ✅ Emulator OTP started — enter any 6-digit code');
          return true;
        }),
        catchError((err: any) => {
          console.error('[OTP] Emulator sendOtp failed:', err?.code, err?.message);
          return of(false);
        })
      );
    }

    // ── Production path ────────────────────────────────────────
    if (!this.recaptchaVerifier) {
      console.error('[OTP] reCAPTCHA not ready — call initRecaptcha() first.');
      return of(false);
    }

    // ✅ FIX: Do NOT call render() manually — signInWithPhoneNumber calls
    // verifier.verify() internally which renders the invisible widget.
    // Calling render() separately on a re-created verifier causes a crash
    // when the container div still has the old widget rendered.
    return from(
      signInWithPhoneNumber(this.auth, phoneNumber, this.recaptchaVerifier)
    ).pipe(
      map((result: ConfirmationResult) => {
        this.confirmationResult = result;
        console.log('[OTP] ✅ SMS dispatched successfully');
        return true;
      }),
      catchError((err: any) => {
        console.error('━━━ [OTP] sendOtp FAILED ━━━');
        console.error('code    :', err?.code);
        console.error('message :', err?.message);
        console.error('server  :', JSON.stringify(err?.customData?.serverResponse ?? '(none)'));
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        // Reset so user can retry — also clears container div
        this.resetRecaptcha();
        return of(false);
      })
    );
  }

  // ─────────────────────────────────────────────────────────────
  //  Verify OTP
  // ─────────────────────────────────────────────────────────────

  verifyOtp(mobileNumber: string, otp: string): Observable<boolean> {
    if (!this.confirmationResult) {
      console.error('[OTP] No active session. Call sendOtp() first.');
      return of(false);
    }
    return from(this.confirmationResult.confirm(otp)).pipe(
      map((credential) => {
        console.log('[OTP] ✅ Phone verified:', credential.user?.phoneNumber);
        this.confirmationResult = null;
        return true;
      }),
      catchError((err: any) => {
        // auth/invalid-verification-code → wrong OTP entered
        // auth/code-expired             → OTP expired (> 10 min)
        console.error('[OTP] verifyOtp failed:', err?.code, err?.message);
        return of(false);
      })
    );
  }

  // ─────────────────────────────────────────────────────────────
  //  Resend OTP
  // ─────────────────────────────────────────────────────────────

  /**
   * Resets state, re-initialises reCAPTCHA on the same container,
   * then sends a fresh OTP.
   */
  resendOtp(mobileNumber: string): Observable<boolean> {
    this.confirmationResult = null;
    // Reset clears verifier + wipes container HTML
    this.resetRecaptcha();
    // Re-init fresh verifier on same container before re-sending
    this.initRecaptcha(this.containerId);
    return this.sendOtp(mobileNumber);
  }

  // ─────────────────────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────────────────────

  private cleanMobileNumber(mobile: string): string {
    return mobile.replace(/\D/g, '').slice(-10);
  }

  private isValidIndianMobile(mobile: string): boolean {
    return /^[6-9]\d{9}$/.test(mobile);
  }
}