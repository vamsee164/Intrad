import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, timeout, retry, switchMap } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ServiceInfoComponent } from '../service-info/service-info.component';
import { LoginComponent } from '../login/login.component';
import { AuthService, User } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';
import { OtpService } from '../../services/otp.service';
import { NotificationService } from '../../services/notification.service';
import { TranslatePipe } from '../../shared/translate.pipe';
import { OtpVerificationComponent } from '../../shared/otp-verification/otp-verification.component';
import { environment } from '../../../environments/environment';

declare var bootstrap: any;

interface SignupFormData {
  name: string;
  typicalCrops: string[];
  village: string;
  waterSource: string;
  mandal: string;
  soilTest: string;
  mobileNo: string;
  soilType: string;
  acreOfLand: number | null;
  fertilizers: string;
  role: string;
  companyName: string;
  personalEmail: string; // personal email to receive login credentials
}

interface WeatherData {
  location: string;
  temperature: number | string;
  description: string;
  humidity: number | string;
  windSpeed: number | string;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ServiceInfoComponent, LoginComponent, TranslatePipe, OtpVerificationComponent],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly API_TIMEOUT = 10000;
  private readonly MAX_RETRIES = 2;
  
  isLoggedIn = false;
  currentUser: User | null = null;
  selectedFeature = '';
  weatherData: WeatherData | null = null;
  hoveredPhase: number | null = null;
  
  farmersData = {
    totalFarmers: 0,
    activeFarmers: 0,
    newThisMonth: 0,
    totalLandAcres: 0
  };

  signupData: SignupFormData = {
    name: '', typicalCrops: [], village: '', waterSource: '',
    mandal: '', soilTest: '', mobileNo: '', soilType: '',
    acreOfLand: null, fertilizers: '', role: '', companyName: '',
    personalEmail: ''
  };

  readonly cropOptions = [
    { value: 'mango', label: 'Mango' },
    { value: 'banana', label: 'Banana' },
    { value: 'papaya', label: 'Papaya' },
    { value: 'tomato', label: 'Tomato' },
    { value: 'onion', label: 'Onion' },
    { value: 'lemon', label: 'Lemon' },
    { value: 'watermelon', label: 'Watermelon' },
    { value: 'muskmelon', label: 'Muskmelon' },
    { value: 'spinach', label: 'Spinach' },
    { value: 'methi', label: 'Methi' },
    { value: 'coriander', label: 'Coriander' },
    { value: 'curry-leaves', label: 'Curry Leaves' }
  ];

  showOtpModal: boolean = false;
  isMobileVerified: boolean = false;
  showOtpField: boolean = false;
  otpCode: string = '';
  otpSent: boolean = false;
  isVerifyingOtp: boolean = false;
  isSendingOtp: boolean = false;
  otpMessage: string = '';
  otpMessageType: 'success' | 'danger' = 'danger';
  /** Dev-only: shows the generated OTP so tester can enter it (no SMS API connected yet) */
  devOtpPreview: string = '';

  registeredEmail = '';
  registeredPassword = '';
  registeredMobileNo = '';
  successModalTitle = 'Form Submission';
  signupError = ''; // holds the last registration error message shown in the modal

  forgotPasswordData = {
    email: '' // registered @intra-d.com email
  };

  forgotPasswordLoading = false;
  forgotPasswordMessage = '';
  forgotPasswordMessageType: 'success' | 'danger' = 'danger';

  @ViewChild('signupForm') signupHtmlForm!: NgForm;
  @ViewChild('forgotForm') forgotHtmlForm!: NgForm;

  private readonly apiKey = environment.weatherApiKey;
  private readonly apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly firebaseService: FirebaseService,
    private readonly otpService: OtpService,
    private readonly notificationService: NotificationService
  ) {}

  onCropChange(value: string, event: any): void {
    if (event.target.checked) {
      this.signupData.typicalCrops = [...this.signupData.typicalCrops, value];
    } else {
      this.signupData.typicalCrops = this.signupData.typicalCrops.filter(c => c !== value);
    }
  }

  onPhoneInput(event: any): void {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }
  }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.isLoggedIn = !!user;
          // Auto-redirect logged-in users to their role dashboard
          // so old sessions never see the stale service-info UI
          if (user) {
            const dashboardRoute = this.authService.getDashboardRoute(user.role);
            this.router.navigate([dashboardRoute]);
          }
        },
        error: (error) => {
          console.error('Error in user subscription:', error);
        }
      });

    this.loadFarmersData();
  }

  private loadFarmersData(): void {
    this.firebaseService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          if (users) {
            let farmerCount = 0;
            let newThisMonth = 0;
            let totalLand = 0;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Fix #2: users stored flat {uid: {email, role, ...}} not double-nested
            for (const uid of Object.keys(users)) {
              const user = users[uid];
              if (user?.role === 'farmer') {
                farmerCount++;
                if (user.createdAt && user.createdAt >= startOfMonth) newThisMonth++;
                const acres = parseFloat(user.acreOfLand);
                if (!isNaN(acres) && acres > 0) {
                  totalLand += acres;
                }
              }
            }
            this.farmersData.totalFarmers = farmerCount;
            this.farmersData.activeFarmers = farmerCount;
            this.farmersData.newThisMonth = newThisMonth;
            this.farmersData.totalLandAcres = Math.round(totalLand * 10) / 10;
          }
        },
        error: () => {
          // Silent — don't break homepage if DB is unreachable
        }
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPhaseHover(phase: number): void {
    this.hoveredPhase = phase;
  }

  onPhaseLeave(): void {
    this.hoveredPhase = null;
  }

  onLoginSuccess(): void {}

  handleLogout(): void {
    this.authService.logout('/homepage');
  }

  setComingSoonFeature(feature: string): void {
    this.selectedFeature = feature.replace(/[<>]/g, '').trim();
  }

  private getCurrentLocation(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        console.error('Geolocation not supported by browser');
        reject(new Error('Geolocation not supported'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Geolocation timeout'));
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  }

  async showWeather(): Promise<void> {
    try {
      console.log('Fetching weather data');
      const { lat, lon } = await this.getCurrentLocation();
      
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        throw new Error('Invalid coordinates');
      }

      const requestUrl = `${this.apiUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;

      this.http.get(requestUrl)
        .pipe(
          timeout(this.API_TIMEOUT),
          retry(this.MAX_RETRIES),
          catchError((error: HttpErrorResponse) => {
            console.error('Weather API error:', error);
            return of(null);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.weatherData = {
                location: (data.name || 'Unknown').replace(/[<>]/g, ''),
                temperature: Math.round(data.main?.temp || 0),
                description: (data.weather?.[0]?.description || 'No data').replace(/[<>]/g, ''),
                humidity: data.main?.humidity || 'N/A',
                windSpeed: data.wind?.speed || 'N/A'
              };
              this.selectedFeature = 'Weather';
              this.showModal('weatherModal');
            } else {
              this.showErrorModal('Weather service unavailable');
            }
          },
          error: () => {
            this.showErrorModal('Error fetching weather data');
          }
        });
    } catch (error) {
      console.error('Weather fetch error:', error);
      this.showErrorModal('Could not get location. Please enable location services.');
    }
  }

  private showErrorModal(message: string): void {
    const sanitizedMessage = message.replace(/[<>]/g, '').trim();
    this.weatherData = {
      location: 'Error',
      temperature: 'N/A',
      description: sanitizedMessage,
      humidity: 'N/A',
      windSpeed: 'N/A'
    };
    this.selectedFeature = 'Weather';
    this.showModal('weatherModal');
    console.warn('Error modal shown:', sanitizedMessage);
  }

  private showModal(modalId: string): void {
    try {
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
      }
    } catch (error) {
      console.error('Modal show error:', error);
    }
  }

  showFarmers(): void {
    this.showModal('farmersModal');
  }

  /** Resets the entire signup form and all OTP state — called on Cancel / modal close */
  resetSignupForm(): void {
    this.signupData = {
      name: '', typicalCrops: [], village: '', waterSource: '',
      mandal: '', soilTest: '', mobileNo: '', soilType: '',
      acreOfLand: null, fertilizers: '', role: '', companyName: '',
      personalEmail: ''
    };
    this.otpSent = false;
    this.showOtpField = false;
    this.isMobileVerified = false;
    this.otpCode = '';
    this.otpMessage = '';
    this.otpMessageType = 'danger';
    this.isSendingOtp = false;
    this.isVerifyingOtp = false;
    this.devOtpPreview = '';
    this.signupError = '';
    // Reset the Angular form control state (touched / dirty / submitted)
    if (this.signupHtmlForm) {
      this.signupHtmlForm.resetForm();
    }
  }

  /** Allows the user to edit the mobile number after OTP was sent */
  editMobileNumber(): void {
    this.otpSent = false;
    this.showOtpField = false;
    this.isMobileVerified = false;
    this.otpCode = '';
    this.otpMessage = '';
    this.otpMessageType = 'danger';
    this.devOtpPreview = '';
    // Reset Firebase reCAPTCHA so it can be re-initialised for next attempt
    this.otpService.resetRecaptcha();
  }

  handleSignup(): void {
    if (this.signupHtmlForm.invalid) {
      this.signupHtmlForm.form.markAllAsTouched();
      console.warn('Invalid signup form submission');
      return;
    }

    // ── OTP mobile verification temporarily disabled ──
    // TODO: Re-enable when Firebase Phone Auth SMS delivery is confirmed working.
    // if (!this.isMobileVerified) {
    //   if (!this.otpSent) {
    //     this.sendOtpForVerification();
    //   } else {
    //     this.otpMessage = 'Please verify the OTP sent to your mobile number';
    //     this.otpMessageType = 'danger';
    //   }
    //   return;
    // }
    this.isMobileVerified = true; // bypass — remove this line when OTP is re-enabled

    this.performSignup();
  }

  sendOtpForVerification(): void {
    if (!this.signupData.mobileNo || this.signupData.mobileNo.length !== 10) {
      this.otpMessage = 'Please enter a valid 10-digit mobile number first.';
      this.otpMessageType = 'danger';
      return;
    }
    this.isSendingOtp = true;
    this.otpMessage = '';
    // Initialise Firebase reCAPTCHA then send OTP via Firebase Phone Auth
    this.otpService.initRecaptcha('recaptcha-container-signup');
    this.otpService.sendOtp(this.signupData.mobileNo).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result: boolean) => {
        this.isSendingOtp = false;
        if (result) {
          this.showOtpField = true;
          this.otpSent = true;
          this.otpMessage = 'OTP sent to your mobile via SMS. Enter it below.';
          this.otpMessageType = 'success';
        } else {
          this.otpMessage = 'Failed to send OTP. Please try again.';
          this.otpMessageType = 'danger';
        }
      },
      error: () => {
        this.isSendingOtp = false;
        this.otpMessage = 'Failed to send OTP. Check your connection and try again.';
        this.otpMessageType = 'danger';
      }
    });
  }

  verifyOtpInline(): void {
    if (this.otpCode.length !== 6) {
      this.otpMessage = 'Please enter a valid 6-digit OTP';
      this.otpMessageType = 'danger';
      return;
    }
    this.isVerifyingOtp = true;
    this.otpMessage = '';
    this.otpService.verifyOtp(this.signupData.mobileNo, this.otpCode).pipe(takeUntil(this.destroy$)).subscribe({
      next: (isValid) => {
        this.isVerifyingOtp = false;
        if (isValid) {
          this.isMobileVerified = true;
          this.otpMessage = 'Mobile number verified successfully!';
          this.otpMessageType = 'success';
        } else {
          this.otpMessage = 'Invalid OTP. Please try again.';
          this.otpMessageType = 'danger';
        }
      },
      error: () => {
        this.isVerifyingOtp = false;
        this.otpMessage = 'Verification failed. Please try again.';
        this.otpMessageType = 'danger';
      }
    });
  }

  resendOtpInline(): void {
    this.otpCode = '';
    this.otpMessage = '';
    this.devOtpPreview = '';
    // Reset Firebase reCAPTCHA before resending
    this.otpService.resetRecaptcha();
    this.sendOtpForVerification();
  }

  onOtpVerified(verified: boolean): void {
    if (verified) {
      this.isMobileVerified = true;
      this.showOtpModal = false;
      this.performSignup();
    }
  }

  onOtpModalClosed(): void {
    this.showOtpModal = false;
  }

  performSignup(): void {
    if (this.signupHtmlForm.invalid) {
      this.signupHtmlForm.form.markAllAsTouched();
      console.warn('Invalid signup form submission');
      return;
    }

    const sanitizedData = {
      ...this.signupData,
      name: this.signupData.name.replace(/[<>]/g, '').trim(),
      village: this.signupData.village.replace(/[<>]/g, '').trim(),
      mandal: this.signupData.mandal.replace(/[<>]/g, '').trim(),
      mobileNo: this.signupData.mobileNo.replace(/[<>]/g, '').trim()
    };

    const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;
    if (!phoneRegex.test(sanitizedData.mobileNo)) {
      console.warn('Invalid phone number in signup');
      alert('Please enter a valid phone number');
      return;
    }

    console.log('Processing user signup');
    
    this.signupError = '';
    this.firebaseService.createUser(sanitizedData)
      .pipe(
        timeout(this.API_TIMEOUT),
        catchError((err) => {
          // Map Firebase Auth error codes to user-friendly messages
          const code: string = err?.code || err?.error?.message || '';
          if (code.includes('EMAIL_EXISTS') || code === 'auth/email-already-in-use') {
            this.signupError = 'This name is already registered. Please contact the administrator.';
          } else if (code === 'auth/weak-password') {
            this.signupError = 'Password is too weak. Please try again.';
          } else if (code === 'auth/network-request-failed') {
            this.signupError = 'Network error. Please check your connection and try again.';
          } else if (code === 'auth/too-many-requests') {
            this.signupError = 'Too many attempts. Please try again later.';
          } else {
            this.signupError = 'Registration failed. Please try again.';
          }
          console.error('[Signup] Firebase error:', code, err);
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.signupError = '';
            // Set credentials BEFORE hiding so Angular bindings are ready
            this.registeredEmail    = response.email;
            this.registeredPassword = response.generatedPassword;
            this.registeredMobileNo = sanitizedData.mobileNo;
            this.successModalTitle  = 'Registration Successful';

            // Send credentials email non-blocking (failure does not affect signup flow)
            if (sanitizedData.personalEmail) {
              this.notificationService.sendLoginCredentialsEmail(
                response.email,
                response.generatedPassword,
                response.name,
                sanitizedData.personalEmail
              ).pipe(takeUntil(this.destroy$)).subscribe({
                next: (sent) => {
                  if (sent) {
                    console.log('[Signup] Credentials email sent to', sanitizedData.personalEmail);
                  } else {
                    console.warn('[Signup] Credentials email failed — user notified on-screen');
                  }
                },
                error: () => console.warn('[Signup] Credentials email error — non-critical')
              });
            }

            // Wait for signup modal to FULLY close (backdrop removed) before
            // opening success modal — prevents invisible backdrop blocking clicks
            const signupEl = document.getElementById('signupModal');
            if (signupEl) {
              signupEl.addEventListener('hidden.bs.modal', () => {
                this.showSuccessModal();
              }, { once: true });
            }
            this.hideModal('signupModal');
          } else if (this.signupError) {
            // Error already set in catchError — show it in the modal, don't close it
          } else {
            this.signupError = 'Registration failed. Please try again.';
          }
        },
        error: (err) => {
          this.signupError = 'Registration failed. Please try again.';
          console.error('[Signup] Unexpected error:', err);
        }
      });
  }

  private hideModal(modalId: string): void {
    try {
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
    } catch (error) {
      console.error('Modal hide error:', error);
    }
  }

  /** Shows the success modal — credentials must already be set on the component */
  private showSuccessModal(): void {
    try {
      const el = document.getElementById('successModal');
      if (el) {
        const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
        // Reset signup form data only AFTER the success modal is fully closed
        el.addEventListener('hidden.bs.modal', () => this.resetSignupForm(), { once: true });
        modal.show();
      }
    } catch (err) {
      console.error('Error showing success modal:', err);
    }
  }

  // ====== Forgot Password — Email Reset Logic ======

  handleForgotPassword(): void {
    if (this.forgotHtmlForm.invalid) {
      this.forgotHtmlForm.form.markAllAsTouched();
      console.warn('[ForgotPassword] Invalid form submission');
      return;
    }

    const email = this.forgotPasswordData.email.trim();
    if (!email) {
      this.forgotPasswordMessage = 'Please enter your registered email address.';
      this.forgotPasswordMessageType = 'danger';
      return;
    }

    this.forgotPasswordLoading = true;
    this.forgotPasswordMessage = '';

    this.notificationService.sendPasswordResetEmail(email)
      .pipe(
        timeout(this.API_TIMEOUT),
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (sent) => {
          this.forgotPasswordLoading = false;
          // Always show success (security: don't reveal if email exists)
          this.forgotPasswordMessage =
            'If this email is registered, a password reset link has been sent. Please check your inbox.';
          this.forgotPasswordMessageType = 'success';
          if (sent) {
            console.log('[ForgotPassword] Reset email sent to', email);
          } else {
            console.warn('[ForgotPassword] Reset email may not have been delivered');
          }
        },
        error: () => {
          this.forgotPasswordLoading = false;
          this.forgotPasswordMessage = 'Failed to send reset email. Please try again.';
          this.forgotPasswordMessageType = 'danger';
        }
      });
  }

  resetForgotPasswordForm(): void {
    this.forgotPasswordData = { email: '' };
    this.forgotPasswordMessage = '';
    this.forgotPasswordMessageType = 'danger';
    this.forgotPasswordLoading = false;
    if (this.forgotHtmlForm) {
      this.forgotHtmlForm.resetForm();
    }
  }

  // ====== End Forgot Password Logic ======

  trackByFn(index: number, item: any): any {
    return item?.value || item?.id || index;
  }

  /** Copies text to clipboard — works on both HTTP (localhost) and HTTPS */
  copyToClipboard(text: string, feedbackId: string): void {
    const showFeedback = () => {
      const el = document.getElementById(feedbackId);
      if (el) {
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 2000);
      }
    };

    // Modern clipboard API (HTTPS / secure contexts)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(showFeedback).catch(() => this.fallbackCopy(text, showFeedback));
    } else {
      this.fallbackCopy(text, showFeedback);
    }
  }

  private fallbackCopy(text: string, onSuccess: () => void): void {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      onSuccess();
    } catch (e) {
      console.warn('Copy failed', e);
    } finally {
      document.body.removeChild(ta);
    }
  }
}