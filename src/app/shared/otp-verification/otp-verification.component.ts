import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OtpService } from '../../services/otp.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="otp-overlay" *ngIf="showOtpModal" role="dialog" aria-modal="true" aria-labelledby="otpModalTitle">
      <div class="otp-modal">
        <!-- Header -->
        <div class="otp-modal-header">
          <div class="otp-icon">
            <i class="fas fa-mobile-alt"></i>
          </div>
          <h4 id="otpModalTitle" class="otp-title">Verify Mobile Number</h4>
          <p class="otp-subtitle">
            OTP sent to <strong>+91 {{ mobileNumber }}</strong>
          </p>
        </div>

        <!-- reCAPTCHA container (invisible) -->
        <div id="recaptcha-container"></div>

        <!-- OTP Input -->
        <div class="otp-input-section">
          <div class="otp-boxes">
            <input
              *ngFor="let box of [0,1,2,3,4,5]; let i = index"
              type="text"
              maxlength="1"
              inputmode="numeric"
              pattern="[0-9]"
              class="otp-box"
              [id]="'otp-box-' + i"
              [value]="otpDigits[i] || ''"
              (input)="onDigitInput($event, i)"
              (keydown)="onKeyDown($event, i)"
              (paste)="onPaste($event)"
              [class.filled]="otpDigits[i]"
              [class.is-invalid]="otpError && !isVerifying"
              autocomplete="one-time-code"
            />
          </div>
          <div class="otp-error" *ngIf="otpError && !isVerifying">
            <i class="fas fa-exclamation-circle me-1"></i>{{ otpError }}
          </div>
        </div>

        <!-- Status Message -->
        <div class="otp-status" *ngIf="statusMessage">
          <div [class]="'otp-alert otp-alert-' + statusType">
            <i class="fas" [class.fa-check-circle]="statusType === 'success'"
               [class.fa-exclamation-circle]="statusType === 'danger'"
               [class.fa-info-circle]="statusType === 'info'"></i>
            {{ statusMessage }}
          </div>
        </div>

        <!-- Timer -->
        <div class="otp-timer" *ngIf="otpSent && !isVerified">
          <span *ngIf="timeLeft > 0">
            <i class="fas fa-clock me-1"></i>Resend OTP in <strong>{{ timeLeft }}s</strong>
          </span>
          <span *ngIf="timeLeft === 0">
            Didn't receive OTP?
            <button class="btn-link-green" (click)="resendOtp()" [disabled]="isResending" type="button">
              {{ isResending ? 'Sending...' : 'Resend OTP' }}
            </button>
          </span>
        </div>

        <!-- Actions -->
        <div class="otp-actions" *ngIf="!isVerified">
          <button
            class="btn-otp-verify"
            (click)="verifyOtp()"
            [disabled]="isVerifying || otpCode.length !== 6"
            type="button">
            <span *ngIf="!isVerifying"><i class="fas fa-shield-alt me-2"></i>Verify OTP</span>
            <span *ngIf="isVerifying">
              <span class="otp-spinner"></span> Verifying...
            </span>
          </button>
          <button class="btn-otp-cancel" (click)="closeModal()" type="button">Cancel</button>
        </div>

        <!-- Success State -->
        <div class="otp-success" *ngIf="isVerified">
          <i class="fas fa-check-circle"></i>
          <p>Mobile number verified!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .otp-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }

    .otp-modal {
      background: #ffffff;
      border-radius: 20px;
      padding: 2rem 2.5rem;
      max-width: 420px;
      width: 92%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      animation: slideUp 0.3s ease;
      text-align: center;
    }

    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    .otp-modal-header { margin-bottom: 1.5rem; }

    .otp-icon {
      width: 64px; height: 64px;
      background: linear-gradient(135deg, #2d5016, #6b8e23);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
    }
    .otp-icon i { color: #fff; font-size: 1.75rem; }

    .otp-title { font-size: 1.4rem; font-weight: 700; color: #1a1a1a; margin: 0 0 0.4rem; }
    .otp-subtitle { color: #666; font-size: 0.9rem; margin: 0; }

    /* 6-box OTP input */
    .otp-input-section { margin: 1.5rem 0 1rem; }
    .otp-boxes {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    .otp-box {
      width: 48px; height: 56px;
      border: 2px solid #d4c5b9;
      border-radius: 12px;
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: #f8fffe;
    }
    .otp-box:focus {
      border-color: #2d5016;
      box-shadow: 0 0 0 3px rgba(45,80,22,0.2);
      background: #fff;
    }
    .otp-box.filled {
      border-color: #6b8e23;
      background: #f0f7e6;
    }
    .otp-box.is-invalid {
      border-color: #dc3545;
      box-shadow: 0 0 0 3px rgba(220,53,69,0.15);
    }

    @media (max-width: 400px) {
      .otp-box { width: 40px; height: 50px; font-size: 1.2rem; }
      .otp-boxes { gap: 7px; }
    }

    .otp-error {
      color: #dc3545;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    /* Status alerts */
    .otp-alert {
      padding: 0.6rem 1rem;
      border-radius: 10px;
      font-size: 0.88rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.5rem;
    }
    .otp-alert-success { background: #d1f0d1; color: #1a5c1a; }
    .otp-alert-danger  { background: #ffe0e0; color: #8b1a1a; }
    .otp-alert-info    { background: #e0f0ff; color: #1a458b; }

    /* Timer */
    .otp-timer { font-size: 0.88rem; color: #666; margin: 0.75rem 0 1.25rem; }
    .btn-link-green {
      background: none; border: none; padding: 0;
      color: #2d5016; font-weight: 600; cursor: pointer;
      text-decoration: underline;
    }
    .btn-link-green:hover { color: #6b8e23; }

    /* Action buttons */
    .otp-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .btn-otp-verify {
      background: linear-gradient(135deg, #2d5016, #6b8e23);
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 0.75rem 2rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    }
    .btn-otp-verify:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-otp-verify:not(:disabled):hover { opacity: 0.9; transform: translateY(-1px); }

    .btn-otp-cancel {
      background: transparent;
      color: #666;
      border: 2px solid #ddd;
      border-radius: 50px;
      padding: 0.6rem 1.5rem;
      font-size: 0.9rem;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .btn-otp-cancel:hover { border-color: #999; color: #333; }

    /* Spinner */
    .otp-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      display: inline-block;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Success state */
    .otp-success { text-align: center; padding: 1rem 0; }
    .otp-success i { font-size: 3rem; color: #2d5016; }
    .otp-success p { color: #2d5016; font-weight: 600; margin-top: 0.5rem; font-size: 1rem; }
  `]
})
export class OtpVerificationComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() mobileNumber: string = '';
  @Input() showOtpModal: boolean = false;
  @Output() otpVerified = new EventEmitter<boolean>();
  @Output() modalClosed = new EventEmitter<void>();

  otpDigits: string[] = ['', '', '', '', '', ''];
  otpCode: string = '';
  otpError: string = '';

  isVerifying: boolean = false;
  isResending: boolean = false;
  isVerified: boolean = false;
  otpSent: boolean = false;

  statusMessage: string = '';
  statusType: 'success' | 'danger' | 'info' = 'info';

  timeLeft: number = 60;
  private timerInterval: any;
  private destroy$ = new Subject<void>();

  constructor(
    private otpService: OtpService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (this.showOtpModal) {
      this.startFlow();
    }
  }

  ngAfterViewInit(): void {
    // Initialise reCAPTCHA after view is ready
    if (isPlatformBrowser(this.platformId) && this.showOtpModal) {
      setTimeout(() => this.initAndSend(), 300);
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.destroy$.next();
    this.destroy$.complete();
    this.otpService.resetRecaptcha();
  }

  private startFlow(): void {
    this.resetState();
  }

  private initAndSend(): void {
    this.otpService.initRecaptcha('recaptcha-container');
    this.doSendOtp();
  }

  private doSendOtp(): void {
    this.statusMessage = 'Sending OTP...';
    this.statusType = 'info';

    this.otpService.sendOtp(this.mobileNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.otpSent = true;
            this.statusMessage = `OTP sent to +91 ${this.mobileNumber}`;
            this.statusType = 'success';
            this.startTimer();
          } else {
            this.statusMessage = 'Failed to send OTP. Please try again.';
            this.statusType = 'danger';
          }
        },
        error: () => {
          this.statusMessage = 'Failed to send OTP. Check your connection.';
          this.statusType = 'danger';
        }
      });
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    this.otpDigits[index] = value;
    input.value = value;
    this.otpError = '';
    this.updateOtpCode();

    if (value && index < 5) {
      const next = document.getElementById(`otp-box-${index + 1}`) as HTMLInputElement;
      next?.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        this.otpDigits[index - 1] = '';
        this.updateOtpCode();
        const prev = document.getElementById(`otp-box-${index - 1}`) as HTMLInputElement;
        prev?.focus();
      } else {
        this.otpDigits[index] = '';
        this.updateOtpCode();
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    digits.forEach((d, i) => { if (i < 6) this.otpDigits[i] = d; });
    this.updateOtpCode();
    // Focus last filled box
    const lastIndex = Math.min(digits.length, 5);
    const el = document.getElementById(`otp-box-${lastIndex}`) as HTMLInputElement;
    el?.focus();
  }

  private updateOtpCode(): void {
    this.otpCode = this.otpDigits.join('');
  }

  verifyOtp(): void {
    if (this.otpCode.length !== 6) {
      this.otpError = 'Please enter all 6 digits';
      return;
    }

    this.isVerifying = true;
    this.otpError = '';
    this.statusMessage = '';

    this.otpService.verifyOtp(this.mobileNumber, this.otpCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isValid) => {
          this.isVerifying = false;
          if (isValid) {
            this.isVerified = true;
            this.clearTimer();
            this.statusMessage = 'Mobile number verified successfully!';
            this.statusType = 'success';
            setTimeout(() => {
              this.otpVerified.emit(true);
              this.closeModal();
            }, 1200);
          } else {
            this.otpError = 'Incorrect OTP. Please try again.';
            this.otpDigits = ['', '', '', '', '', ''];
            this.otpCode = '';
            // Focus first box
            setTimeout(() => {
              (document.getElementById('otp-box-0') as HTMLInputElement)?.focus();
            }, 100);
          }
        },
        error: () => {
          this.isVerifying = false;
          this.otpError = 'Verification failed. Please try again.';
        }
      });
  }

  resendOtp(): void {
    this.isResending = true;
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpCode = '';
    this.otpError = '';
    this.statusMessage = '';

    this.otpService.resendOtp(this.mobileNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          this.isResending = false;
          if (success) {
            this.statusMessage = 'OTP resent successfully!';
            this.statusType = 'success';
            this.startTimer();
          } else {
            this.statusMessage = 'Failed to resend OTP. Try again.';
            this.statusType = 'danger';
          }
        },
        error: () => {
          this.isResending = false;
          this.statusMessage = 'Failed to resend OTP.';
          this.statusType = 'danger';
        }
      });
  }

  closeModal(): void {
    this.clearTimer();
    this.otpService.resetRecaptcha();
    this.resetState();
    this.modalClosed.emit();
  }

  private startTimer(): void {
    this.clearTimer();
    this.timeLeft = 60;
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.clearTimer();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private resetState(): void {
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpCode = '';
    this.otpError = '';
    this.isVerifying = false;
    this.isResending = false;
    this.isVerified = false;
    this.otpSent = false;
    this.statusMessage = '';
    this.timeLeft = 60;
  }
}