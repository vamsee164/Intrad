import { Component, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginData = { email: '', password: '' };
  loginMessage: string = '';
  loginMessageType: 'success' | 'danger' | '' = '';
  isLoading: boolean = false;

  @Output() loginSuccess = new EventEmitter<void>();
  @ViewChild('loginForm') loginHtmlForm!: NgForm;

  constructor(private authService: AuthService, private router: Router) {}

  handleLogin(): void {
    if (!this.loginHtmlForm.valid) return;
    
    this.isLoading = true;
    this.loginMessage = '';
    
    this.authService.login(this.loginData.email, this.loginData.password)
      .subscribe({
        next: (success) => {
          this.isLoading = false;
          if (success) {
            this.loginMessage = 'Login successful!';
            this.loginMessageType = 'success';
            this.loginHtmlForm.resetForm();
            this.loginSuccess.emit();
            this.router.navigate(['/control']);
          } else {
            this.loginMessage = 'Invalid username or password.';
            this.loginMessageType = 'danger';
          }
        },
        error: () => {
          this.isLoading = false;
          this.loginMessage = 'Login failed. Please try again.';
          this.loginMessageType = 'danger';
        }
      });
  }
}
