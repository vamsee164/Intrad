import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { catchError, timeout, retry, takeUntil } from 'rxjs/operators';

import { of, Subject } from 'rxjs';

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

  // Multiple crops can be selected
  typicalCrops: string[];

  // Multiple fertilizers can be selected
  fertilizers: string[];

  village: string;
  waterSource: string;
  mandal: string;
  soilTest: string;
  mobileNo: string;
  soilType: string;
  acreOfLand: number | null;
  role: string;
  companyName: string;
  personalEmail: string;
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
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ServiceInfoComponent,
    LoginComponent,
    TranslatePipe,
    OtpVerificationComponent,
  ],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'],
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
    totalLandAcres: 0,
  };

  // ============================================================
  // SIGNUP DATA
  // ============================================================

  signupData: SignupFormData = {
    name: '',
    typicalCrops: [],
    fertilizers: [],
    village: '',
    waterSource: '',
    mandal: '',
    soilTest: '',
    mobileNo: '',
    soilType: '',
    acreOfLand: null,
    role: '',
    companyName: '',
    personalEmail: '',
  };

  // ============================================================
  // CROP OPTIONS
  // ============================================================

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
    { value: 'curry-leaves', label: 'Curry Leaves' },
  ];

  // ============================================================
  // FERTILIZER OPTIONS
  // ============================================================

  readonly fertilizersOptions = [
    { value: 'urea', label: 'Urea' },
    { value: 'dap', label: 'DAP' },
    { value: 'mop', label: 'MOP (Potash)' },
    { value: 'npk', label: 'NPK Complex' },
    { value: 'organic', label: 'Organic Fertilizers' },
  ];

  // ============================================================
  // OTP
  // ============================================================

  showOtpModal = false;
  isMobileVerified = false;
  showOtpField = false;

  otpCode = '';
  otpSent = false;

  isVerifyingOtp = false;
  isSendingOtp = false;

  otpMessage = '';
  otpMessageType: 'success' | 'danger' = 'danger';

  devOtpPreview = '';

  // ============================================================
  // REGISTRATION
  // ============================================================

  registeredEmail = '';
  registeredPassword = '';
  registeredMobileNo = '';

  successModalTitle = 'Form Submission';

  signupError = '';

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  forgotPasswordData = {
    email: '',
  };

  forgotPasswordLoading = false;

  forgotPasswordMessage = '';

  forgotPasswordMessageType: 'success' | 'danger' = 'danger';

  // ============================================================
  // FORM REFERENCES
  // ============================================================

  @ViewChild('signupForm')
  signupHtmlForm!: NgForm;

  @ViewChild('forgotForm')
  forgotHtmlForm!: NgForm;

  // ============================================================
  // WEATHER
  // ============================================================

  private readonly apiKey = environment.weatherApiKey;

  private readonly apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly firebaseService: FirebaseService,
    private readonly otpService: OtpService,
    private readonly notificationService: NotificationService,
  ) {}

  onLoginSuccess(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.currentUser = this.authService.getCurrentUser();
    const dashboardRoute = this.authService.getDashboardRoute();
    this.router.navigate([dashboardRoute]);
  }

  // ============================================================
  // CROP CHECKBOX
  // ============================================================

  onCropChange(value: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      // Prevent duplicate values
      if (!this.signupData.typicalCrops.includes(value)) {
        this.signupData.typicalCrops = [...this.signupData.typicalCrops, value];
      }
    } else {
      this.signupData.typicalCrops = this.signupData.typicalCrops.filter(
        (crop) => crop !== value,
      );
    }
  }

  // ============================================================
  // FERTILIZER CHECKBOX
  // ============================================================

  onFertilizerChange(value: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      // Prevent duplicate values
      if (!this.signupData.fertilizers.includes(value)) {
        this.signupData.fertilizers = [...this.signupData.fertilizers, value];
      }
    } else {
      this.signupData.fertilizers = this.signupData.fertilizers.filter(
        (fertilizer) => fertilizer !== value,
      );
    }
  }

  // ============================================================
  // PHONE INPUT
  // ============================================================

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/[^0-9]/g, '');

    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }

    this.signupData.mobileNo = input.value;
  }

  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isLoggedIn = !!user;

        if (user) {
          const dashboardRoute = this.authService.getDashboardRoute(user.role);

          this.router.navigate([dashboardRoute]);
        }
      },

      error: (error) => {
        console.error('Error in user subscription:', error);
      },
    });

    this.loadFarmersData();
  }

  // ============================================================
  // LOAD FARMERS
  // ============================================================

  private loadFarmersData(): void {
    this.firebaseService
      .getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          if (!users) {
            return;
          }

          let farmerCount = 0;
          let newThisMonth = 0;
          let totalLand = 0;

          const now = new Date();

          const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
          ).toISOString();

          for (const uid of Object.keys(users)) {
            const user = users[uid];

            if (user?.role === 'farmer') {
              farmerCount++;

              if (user.createdAt && user.createdAt >= startOfMonth) {
                newThisMonth++;
              }

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
        },

        error: () => {
          console.warn('Unable to load farmers data');
        },
      });
  }

  // ============================================================
  // DESTROY
  // ============================================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // PHASE
  // ============================================================

  onPhaseHover(phase: number): void {
    this.hoveredPhase = phase;
  }

  onPhaseLeave(): void {
    this.hoveredPhase = null;
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  handleLogout(): void {
    this.authService.logout('/homepage');
  }

  // ============================================================
  // COMING SOON
  // ============================================================

  setComingSoonFeature(feature: string): void {
    this.selectedFeature = feature.replace(/[<>]/g, '').trim();
  }

  // ============================================================
  // LOCATION
  // ============================================================

  private getCurrentLocation(): Promise<{
    lat: number;
    lon: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
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
            lon: position.coords.longitude,
          });
        },

        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },

        {
          timeout: 10000,
          enableHighAccuracy: false,
        },
      );
    });
  }

  // ============================================================
  // WEATHER
  // ============================================================

  async showWeather(): Promise<void> {
    try {
      const { lat, lon } = await this.getCurrentLocation();

      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        throw new Error('Invalid coordinates');
      }

      const requestUrl =
        `${this.apiUrl}?lat=${lat}` +
        `&lon=${lon}` +
        `&appid=${this.apiKey}` +
        `&units=metric`;

      this.http
        .get(requestUrl)
        .pipe(
          timeout(this.API_TIMEOUT),
          retry(this.MAX_RETRIES),

          catchError((error: HttpErrorResponse) => {
            console.error('Weather API error:', error);

            return of(null);
          }),

          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.weatherData = {
                location: (data.name || 'Unknown').replace(/[<>]/g, ''),

                temperature: Math.round(data.main?.temp || 0),

                description: (
                  data.weather?.[0]?.description || 'No data'
                ).replace(/[<>]/g, ''),

                humidity: data.main?.humidity || 'N/A',

                windSpeed: data.wind?.speed || 'N/A',
              };

              this.selectedFeature = 'Weather';

              this.showModal('weatherModal');
            } else {
              this.showErrorModal('Weather service unavailable');
            }
          },

          error: () => {
            this.showErrorModal('Error fetching weather data');
          },
        });
    } catch (error) {
      console.error('Weather fetch error:', error);

      this.showErrorModal(
        'Could not get location. Please enable location services.',
      );
    }
  }

  private showErrorModal(message: string): void {
    const sanitizedMessage = message.replace(/[<>]/g, '').trim();

    this.weatherData = {
      location: 'Error',
      temperature: 'N/A',
      description: sanitizedMessage,
      humidity: 'N/A',
      windSpeed: 'N/A',
    };

    this.selectedFeature = 'Weather';

    this.showModal('weatherModal');
  }

  // ============================================================
  // MODAL
  // ============================================================

  private showModal(modalId: string): void {
    try {
      const modalElement = document.getElementById(modalId);

      if (modalElement) {
        const modal =
          bootstrap.Modal.getInstance(modalElement) ||
          new bootstrap.Modal(modalElement);

        modal.show();
      }
    } catch (error) {
      console.error('Modal show error:', error);
    }
  }

  showFarmers(): void {
    this.showModal('farmersModal');
  }

  private hideModal(modalId: string): void {
    try {
      const modalElement = document.getElementById(modalId);

      if (modalElement) {
        const modal =
          bootstrap.Modal.getInstance(modalElement) ||
          new bootstrap.Modal(modalElement);

        modal.hide();
      }
    } catch (error) {
      console.error('Modal hide error:', error);
    }
  }

  // ============================================================
  // RESET SIGNUP
  // ============================================================

  resetSignupForm(): void {
    this.signupData = {
      name: '',
      typicalCrops: [],
      fertilizers: [],
      village: '',
      waterSource: '',
      mandal: '',
      soilTest: '',
      mobileNo: '',
      soilType: '',
      acreOfLand: null,
      role: '',
      companyName: '',
      personalEmail: '',
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

    if (this.signupHtmlForm) {
      this.signupHtmlForm.resetForm();
    }
  }

  // ============================================================
  // EDIT MOBILE
  // ============================================================

  editMobileNumber(): void {
    this.otpSent = false;
    this.showOtpField = false;

    this.isMobileVerified = false;

    this.otpCode = '';

    this.otpMessage = '';

    this.otpMessageType = 'danger';

    this.devOtpPreview = '';

    this.otpService.resetRecaptcha();
  }

  // ============================================================
  // SIGNUP
  // ============================================================

  handleSignup(): void {
    if (this.signupHtmlForm.invalid) {
      this.signupHtmlForm.form.markAllAsTouched();

      return;
    }

    // Make sure at least one crop is selected
    if (this.signupData.typicalCrops.length === 0) {
      return;
    }

    // Make sure at least one fertilizer is selected
    if (this.signupData.fertilizers.length === 0) {
      return;
    }

    // OTP temporarily bypassed
    this.isMobileVerified = true;

    this.performSignup();
  }

  // ============================================================
  // OTP
  // ============================================================

  sendOtpForVerification(): void {
    if (!this.signupData.mobileNo || this.signupData.mobileNo.length !== 10) {
      this.otpMessage = 'Please enter a valid 10-digit mobile number first.';

      this.otpMessageType = 'danger';

      return;
    }

    this.isSendingOtp = true;
    this.otpMessage = '';

    this.otpService.initRecaptcha('recaptcha-container-signup');

    this.otpService
      .sendOtp(this.signupData.mobileNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: boolean) => {
          this.isSendingOtp = false;

          if (result) {
            this.showOtpField = true;
            this.otpSent = true;

            this.otpMessage =
              'OTP sent to your mobile via SMS. Enter it below.';

            this.otpMessageType = 'success';
          } else {
            this.otpMessage = 'Failed to send OTP. Please try again.';

            this.otpMessageType = 'danger';
          }
        },

        error: () => {
          this.isSendingOtp = false;

          this.otpMessage =
            'Failed to send OTP. Check your connection and try again.';

          this.otpMessageType = 'danger';
        },
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

    this.otpService
      .verifyOtp(this.signupData.mobileNo, this.otpCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
        },
      });
  }

  resendOtpInline(): void {
    this.otpCode = '';
    this.otpMessage = '';
    this.devOtpPreview = '';

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

  // ============================================================
  // PERFORM SIGNUP
  // ============================================================

  performSignup(): void {
    if (this.signupHtmlForm.invalid) {
      this.signupHtmlForm.form.markAllAsTouched();

      return;
    }

    if (this.signupData.typicalCrops.length === 0) {
      this.signupError = 'Please select at least one crop.';

      return;
    }

    if (this.signupData.fertilizers.length === 0) {
      this.signupError = 'Please select at least one fertilizer.';

      return;
    }

    const sanitizedData = {
      ...this.signupData,

      name: this.signupData.name.replace(/[<>]/g, '').trim(),

      village: this.signupData.village.replace(/[<>]/g, '').trim(),

      mandal: this.signupData.mandal.replace(/[<>]/g, '').trim(),

      mobileNo: this.signupData.mobileNo.replace(/[<>]/g, '').trim(),

      // Make sure arrays are copied
      typicalCrops: [...this.signupData.typicalCrops],

      fertilizers: [...this.signupData.fertilizers],
    };

    const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;

    if (!phoneRegex.test(sanitizedData.mobileNo)) {
      alert('Please enter a valid phone number');

      return;
    }

    this.signupError = '';

    this.firebaseService
      .createUser(sanitizedData)
      .pipe(
        timeout(this.API_TIMEOUT),

        catchError((err) => {
          const code: string = err?.code || err?.error?.message || '';

          if (
            code.includes('EMAIL_EXISTS') ||
            code === 'auth/email-already-in-use'
          ) {
            this.signupError =
              'This name is already registered. Please contact the administrator.';
          } else if (code === 'auth/weak-password') {
            this.signupError = 'Password is too weak. Please try again.';
          } else if (code === 'auth/network-request-failed') {
            this.signupError =
              'Network error. Please check your connection and try again.';
          } else if (code === 'auth/too-many-requests') {
            this.signupError = 'Too many attempts. Please try again later.';
          } else {
            this.signupError = 'Registration failed. Please try again.';
          }

          console.error('[Signup] Firebase error:', code, err);

          return of(null);
        }),

        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.signupError = '';

            this.registeredEmail = response.email;

            this.registeredPassword = response.generatedPassword;

            this.registeredMobileNo = sanitizedData.mobileNo;

            this.successModalTitle = 'Registration Successful';

            // Send credentials email
            if (sanitizedData.personalEmail) {
              this.notificationService
                .sendLoginCredentialsEmail(
                  response.email,
                  response.generatedPassword,
                  response.name,
                  sanitizedData.personalEmail,
                )
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (sent) => {
                    if (sent) {
                      console.log('[Signup] Credentials email sent');
                    } else {
                      console.warn('[Signup] Credentials email failed');
                    }
                  },

                  error: () => {
                    console.warn('[Signup] Credentials email error');
                  },
                });
            }

            const signupEl = document.getElementById('signupModal');

            if (signupEl) {
              signupEl.addEventListener(
                'hidden.bs.modal',
                () => {
                  this.showSuccessModal();
                },
                { once: true },
              );
            }

            this.hideModal('signupModal');
          } else if (!this.signupError) {
            this.signupError = 'Registration failed. Please try again.';
          }
        },

        error: (err) => {
          this.signupError = 'Registration failed. Please try again.';

          console.error('[Signup] Unexpected error:', err);
        },
      });
  }

  // ============================================================
  // SUCCESS MODAL
  // ============================================================

  private showSuccessModal(): void {
    try {
      const el = document.getElementById('successModal');

      if (el) {
        const modal =
          bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);

        el.addEventListener('hidden.bs.modal', () => this.resetSignupForm(), {
          once: true,
        });

        modal.show();
      }
    } catch (error) {
      console.error('Error showing success modal:', error);
    }
  }

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  handleForgotPassword(): void {
    if (this.forgotHtmlForm.invalid) {
      this.forgotHtmlForm.form.markAllAsTouched();

      return;
    }

    const email = this.forgotPasswordData.email.trim();

    if (!email) {
      this.forgotPasswordMessage =
        'Please enter your registered email address.';

      this.forgotPasswordMessageType = 'danger';

      return;
    }

    this.forgotPasswordLoading = true;

    this.forgotPasswordMessage = '';

    this.notificationService
      .sendPasswordResetEmail(email)
      .pipe(
        timeout(this.API_TIMEOUT),

        catchError(() => of(false)),

        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (sent) => {
          this.forgotPasswordLoading = false;

          this.forgotPasswordMessage =
            'If this email is registered, a password reset link has been sent. Please check your inbox.';

          this.forgotPasswordMessageType = 'success';

          if (sent) {
            console.log('[ForgotPassword] Reset email sent');
          }
        },

        error: () => {
          this.forgotPasswordLoading = false;

          this.forgotPasswordMessage =
            'Failed to send reset email. Please try again.';

          this.forgotPasswordMessageType = 'danger';
        },
      });
  }

  resetForgotPasswordForm(): void {
    this.forgotPasswordData = {
      email: '',
    };

    this.forgotPasswordMessage = '';

    this.forgotPasswordMessageType = 'danger';

    this.forgotPasswordLoading = false;

    if (this.forgotHtmlForm) {
      this.forgotHtmlForm.resetForm();
    }
  }

  // ============================================================
  // TRACK BY
  // ============================================================

  trackByFn(index: number, item: any): any {
    return item?.value || item?.id || index;
  }

  // ============================================================
  // CLIPBOARD
  // ============================================================

  copyToClipboard(text: string, feedbackId: string): void {
    const showFeedback = () => {
      const el = document.getElementById(feedbackId);

      if (el) {
        el.classList.add('visible');

        setTimeout(() => {
          el.classList.remove('visible');
        }, 2000);
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(showFeedback)
        .catch(() => this.fallbackCopy(text, showFeedback));
    } else {
      this.fallbackCopy(text, showFeedback);
    }
  }

  private fallbackCopy(text: string, onSuccess: () => void): void {
    const textarea = document.createElement('textarea');

    textarea.value = text;

    textarea.style.cssText =
      'position:fixed;top:0;left:0;opacity:0;pointer-events:none';

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
      document.execCommand('copy');

      onSuccess();
    } catch (error) {
      console.warn('Copy failed', error);
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
