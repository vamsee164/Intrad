import { Component, OnInit, OnDestroy, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { TranslatePipe } from '../../shared/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  loginData = { email: '', password: '' };
  loginMessage = '';
  loginMessageType: 'success' | 'danger' | '' = '';
  isLoading = false;
  showPassword = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Forgot password modal state
  forgotPasswordData = { email: '' };
  forgotPasswordMessage = '';
  forgotPasswordMessageType: 'success' | 'danger' = 'danger';
  forgotPasswordLoading = false;

  @Output() loginSuccess = new EventEmitter<void>();
  @ViewChild('loginForm') loginHtmlForm!: NgForm;
  @ViewChild('forgotForm') forgotHtmlForm!: NgForm;

  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly router: Router
  ) {}

  isLoggedIn = false;

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.router.navigate([this.authService.getDashboardRoute()]);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private redirectByRole(): void {
    const dashboardRoute = this.authService.getDashboardRoute();
    this.router.navigate([dashboardRoute]);
  }

  /** Single entry point — handles validation then login */
  handleLogin(): void {
    if (!this.loginHtmlForm.valid) {
      this.loginHtmlForm.form.markAllAsTouched();
      return;
    }
    this.performLogin();
  }

  private performLogin(): void {
    this.isLoading = true;
    this.loginMessage = '';

    this.authService.login(this.loginData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          // Navigate immediately — the redirect is sufficient success feedback
          this.loginHtmlForm.resetForm();
          this.loginSuccess.emit();
          this.redirectByRole();
        } else {
          this.loginMessage = 'Invalid email or password. Please check your credentials.';
          this.loginMessageType = 'danger';
        }
      },
      error: () => {
        this.isLoading = false;
        this.loginMessage = 'Network error. Please try again.';
        this.loginMessageType = 'danger';
      }
    });
  }

  /** Handle forgot password reset link submission via Firebase Auth */
  handleForgotPassword(): void {
    if (this.forgotHtmlForm?.invalid) {
      this.forgotHtmlForm.form.markAllAsTouched();
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

    this.notificationService.sendPasswordResetEmail(email).pipe(
      catchError(() => of(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sent) => {
        this.forgotPasswordLoading = false;
        if (sent) {
          this.forgotPasswordMessage = 'Password reset link has been sent to your registered email address. Please check your inbox.';
          this.forgotPasswordMessageType = 'success';
        } else {
          this.forgotPasswordMessage = 'Could not send reset email. Please ensure the email is registered with Intra-D and try again.';
          this.forgotPasswordMessageType = 'danger';
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
}
