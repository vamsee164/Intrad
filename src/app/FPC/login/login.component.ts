import { Component, OnInit, OnDestroy, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators'; // Fix #20: removed unused switchMap import
import { AuthService } from '../../services/auth.service';
// Fix #19: removed unused FirebaseService import
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

  @Output() loginSuccess = new EventEmitter<void>();
  @ViewChild('loginForm') loginHtmlForm!: NgForm;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
    // Fix #19: FirebaseService removed — was injected but never used
  ) {}

  isLoggedIn = false;

  // Fix #9: redirect if user is already logged in when visiting login page
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
          this.loginMessage = 'Login successful!';
          this.loginMessageType = 'success';
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
}
