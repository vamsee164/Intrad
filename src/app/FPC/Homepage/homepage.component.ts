import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, timeout, retry, switchMap } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ServiceInfoComponent } from '../service-info/service-info.component';
import { LoginComponent } from '../login/login.component';
import { AuthService, User } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';
import { OtpService } from '../../services/otp.service';
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
    newThisMonth: 0
  };

  signupData: SignupFormData = {
    name: '', typicalCrops: [], village: '', waterSource: '',
    mandal: '', soilTest: '', mobileNo: '', soilType: '',
    acreOfLand: null, fertilizers: '', role: '', companyName: ''
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
  successModalTitle = 'Form Submission';

  forgotPasswordData = {
    mobileNo: '',
    password: '',
    confirmPassword: ''
  };

  showForgotOtpField: boolean = false;
  isForgotOtpVerified: boolean = false;
  forgotOtpCode: string = '';
  forgotOtpSent: boolean = false;
  isVerifyingForgotOtp: boolean = false;
  isSendingForgotOtp: boolean = false;
  forgotOtpMessage: string = '';
  forgotOtpMessageType: 'success' | 'danger' = 'danger';

  @ViewChild('signupForm') signupHtmlForm!: NgForm;
  @ViewChild('forgotForm') forgotHtmlForm!: NgForm;

  private readonly apiKey = environment.weatherApiKey;
  private readonly apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
    private readonly firebaseService: FirebaseService,
    private readonly otpService: OtpService
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
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Fix #2: users stored flat {uid: {email, role, ...}} not double-nested
            for (const uid of Object.keys(users)) {
              const user = users[uid];
              if (user?.role === 'farmer') {
                farmerCount++;
                if (user.createdAt && user.createdAt >= startOfMonth) newThisMonth++;
              }
            }
            this.farmersData.totalFarmers = farmerCount;
            this.farmersData.activeFarmers = farmerCount;
            this.farmersData.newThisMonth = newThisMonth;
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
      acreOfLand: null, fertilizers: '', role: '', companyName: ''
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
    
    this.firebaseService.createUser(sanitizedData)
      .pipe(
        timeout(this.API_TIMEOUT),
        catchError(() => of(null)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.hideModal('signupModal');
            this.showSuccessModal(sanitizedData.name, response.generatedPassword);
            this.resetSignupForm();
          } else {
            alert('Registration failed. Please try again.');
          }
        },
        error: () => alert('Registration failed. Please try again.')
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

  private showSuccessModal(name: string, password: string): void {
    try {
      const successModalElement = document.getElementById('successModal');
      if (successModalElement) {
        const sanitizedName = name.replace(/[<>]/g, '').trim();
        this.registeredPassword = password.replace(/[<>]/g, '').trim();
        this.registeredEmail = `${sanitizedName.toLowerCase().replace(/\s+/g, '')}@intra-d.com`;
        this.successModalTitle = 'Registration Successful';

        const modal = bootstrap.Modal.getInstance(successModalElement) || new bootstrap.Modal(successModalElement);
        modal.show();
      }
    } catch (error) {
      console.error('Error showing success modal:', error);
    }
  }

  // ====== Forgot Password OTP Logic ======

  sendForgotOtp(): void {
    if (!this.forgotPasswordData.mobileNo || this.forgotPasswordData.mobileNo.length !== 10) {
      this.forgotOtpMessage = 'Please enter a valid 10-digit mobile number.';
      this.forgotOtpMessageType = 'danger';
      return;
    }
    this.isSendingForgotOtp = true;
    this.forgotOtpMessage = '';
    this.otpService.sendOtp(this.forgotPasswordData.mobileNo).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showForgotOtpField = true;
        this.forgotOtpSent = true;
        this.isSendingForgotOtp = false;
        this.forgotOtpMessage = 'OTP sent to your mobile number';
        this.forgotOtpMessageType = 'success';
      },
      error: () => {
        this.isSendingForgotOtp = false;
        this.forgotOtpMessage = 'Failed to send OTP. Please try again.';
        this.forgotOtpMessageType = 'danger';
      }
    });
  }

  verifyForgotOtp(): void {
    if (this.forgotOtpCode.length !== 6) {
      this.forgotOtpMessage = 'Please enter a valid 6-digit OTP';
      this.forgotOtpMessageType = 'danger';
      return;
    }
    this.isVerifyingForgotOtp = true;
    this.forgotOtpMessage = '';
    this.otpService.verifyOtp(this.forgotPasswordData.mobileNo, this.forgotOtpCode).pipe(takeUntil(this.destroy$)).subscribe({
      next: (isValid) => {
        this.isVerifyingForgotOtp = false;
        if (isValid) {
          this.isForgotOtpVerified = true;
          this.forgotOtpMessage = 'Mobile number verified successfully!';
          this.forgotOtpMessageType = 'success';
        } else {
          this.forgotOtpMessage = 'Invalid OTP. Please try again.';
          this.forgotOtpMessageType = 'danger';
        }
      },
      error: () => {
        this.isVerifyingForgotOtp = false;
        this.forgotOtpMessage = 'Verification failed. Please try again.';
        this.forgotOtpMessageType = 'danger';
      }
    });
  }

  resendForgotOtp(): void {
    this.forgotOtpCode = '';
    this.forgotOtpMessage = '';
    this.sendForgotOtp();
  }

  // ====== End Forgot Password OTP Logic ======

  handleForgotPassword(): void {
    if (this.forgotHtmlForm.invalid) {
      this.forgotHtmlForm.form.markAllAsTouched();
      console.warn('Invalid forgot password form submission');
      return;
    }

    if (!this.isForgotOtpVerified) {
      alert('Please verify your mobile number first.');
      return;
    }

    if (this.forgotPasswordData.password !== this.forgotPasswordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    console.log('Processing password reset for:', this.forgotPasswordData.mobileNo);
    
    this.firebaseService.updateUserPassword(this.forgotPasswordData.mobileNo, this.forgotPasswordData.password)
      .pipe(
        timeout(this.API_TIMEOUT),
        catchError(() => of(null)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            alert('Password updated successfully! You can now login with your new password.');
            this.hideModal('forgotPassModal');
            this.forgotHtmlForm.resetForm();
            this.isForgotOtpVerified = false;
            this.showForgotOtpField = false;
            this.forgotOtpSent = false;
            this.forgotOtpMessage = '';
          } else {
            alert('User not found or password update failed.');
          }
        },
        error: () => alert('Password reset failed. Please try again.')
      });
  }

  trackByFn(index: number, item: any): any {
    return item?.value || item?.id || index;
  }
}