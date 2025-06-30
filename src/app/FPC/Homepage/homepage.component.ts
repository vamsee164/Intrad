// src/app/homepage/homepage.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router'; // Only if homepage.html uses routerLink directly

// Import the new DashboardComponent
import { ServiceInfoComponent } from '../service-info/service-info.component';

// To interact with Bootstrap Modals via JS
declare var bootstrap: any;

// Interfaces for form data
interface SignupFormData {
  name: string;
  typicalCrops: string;
  village: string;
  waterSource: string;
  mandal: string;
  soilTest: string;
  aadharNo: string;
  soilType: string;
  acreOfLand: number | null; // Changed to number
  fertilizers: string;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule, // Include RouterModule if you use routerLink in homepage.html
    ServiceInfoComponent, // Import DashboardComponent here
  ],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'],
})
export class HomepageComponent implements OnInit {
  // Login state variables
  isLoggedIn: boolean = false;
  loginData = { username: '', password: '' };
  loginMessage: string = '';
  loginMessageType: 'success' | 'danger' | '' = '';

  // Signup form data
  signupData: SignupFormData = {
    name: '',
    typicalCrops: '',
    village: '',
    waterSource: '',
    mandal: '',
    soilTest: '',
    aadharNo: '',
    soilType: '',
    acreOfLand: null,
    fertilizers: '',
  };

  // ViewChild to get a reference to the NgForm directive instance for forms
  @ViewChild('loginForm') loginHtmlForm!: NgForm;
  @ViewChild('signupForm') signupHtmlForm!: NgForm;

  constructor() {}

  ngOnInit(): void {
    // Initial UI state on page load (starts in logged-out state)
    // You might want to check localStorage or a service for actual login status
    this.updateUIForLoginState(false);
  }

  /**
   * Updates UI visibility based on login status.
   * This is called by login/logout actions.
   * @param isLoggedIn Boolean indicating current login status.
   */
  updateUIForLoginState(loggedIn: boolean): void {
    this.isLoggedIn = loggedIn;
    this.loginMessage = ''; // Clear login message on state change
  }

  /**
   * Handles the login attempt.
   * Simulates authentication and updates the login state.
   */
  handleLogin(): void {
    const { username, password } = this.loginData;
    console.log('Simulating Login...');
    console.log(`Username: ${username}, Password: ${password}`);

    if (username === 'user' && password === 'pass') {
      // Simple hardcoded check
      this.loginMessage = 'Login successful!';
      this.loginMessageType = 'success';
      this.loginHtmlForm.resetForm(); // Reset the form using NgForm reference
      this.updateUIForLoginState(true);
    } else {
      this.loginMessage = 'Invalid username or password.';
      this.loginMessageType = 'danger';
      this.updateUIForLoginState(false);
    }
  }

  /**
   * Handles logout action.
   */
  handleLogout(): void {
    this.updateUIForLoginState(false);
    console.log('Logged out.');
  }

  /**
   * Handles Signup form submission.
   * Collects data and shows success modal.
   */
  handleSignup(): void {
    console.log('Sign Up Form Submitted:', this.signupData);
    // In a real application, send this.signupData to your backend API.

    // Hide signup modal
    const signupModalElement = document.getElementById('signupModal');
    if (signupModalElement) {
      const signupModal =
        bootstrap.Modal.getInstance(signupModalElement) ||
        new bootstrap.Modal(signupModalElement);
      signupModal.hide();
    }

    // Show generic success modal
    const successModalElement = document.getElementById('successModal');
    if (successModalElement) {
      const successModal =
        bootstrap.Modal.getInstance(successModalElement) ||
        new bootstrap.Modal(successModalElement);
      document.getElementById('successModalLabel')!.textContent =
        'Sign Up Success';
      (
        document.querySelector('#successModal .modal-body') as HTMLElement
      ).textContent = 'Your sign-up form has been submitted successfully!';
      successModal.show();
    }
    this.signupHtmlForm.resetForm(); // Reset the form using NgForm reference
  }
}
