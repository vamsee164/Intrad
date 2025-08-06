// src/app/homepage/homepage.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';


// Import components and services
import { ServiceInfoComponent } from '../service-info/service-info.component';
import { LoginComponent } from '../login/login.component';
import { AuthService, User } from '../../services/auth.service';



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
    RouterModule,

    ServiceInfoComponent,
    LoginComponent,
  ],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'],
})
export class HomepageComponent implements OnInit {
  isLoggedIn: boolean = false;
  currentUser: User | null = null;

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

  // ViewChild to get a reference to the NgForm directive instance for signup form
  @ViewChild('signupForm') signupHtmlForm!: NgForm;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });
  }

  onLoginSuccess(): void {
    // Login state is handled by the auth service subscription
  }

  handleLogout(): void {
    this.authService.logout();
  }

  selectedFeature = '';
  weatherData: any = null;
  farmersData = {
    totalFarmers: 1250,
    activeFarmers: 980,
    newThisMonth: 45
  };

  setComingSoonFeature(feature: string): void {
    this.selectedFeature = feature;
  }

  showWeather(): void {
    // Mock weather data until HttpClient provider is fixed
    this.weatherData = {
      location: 'Hyderabad',
      temperature: 28,
      description: 'partly cloudy',
      humidity: 65,
      windSpeed: 3.2
    };
    this.selectedFeature = 'Weather';
    // Show weather modal
    const weatherModal = document.getElementById('weatherModal');
    if (weatherModal) {
      const modal = bootstrap.Modal.getInstance(weatherModal) || new bootstrap.Modal(weatherModal);
      modal.show();
    }
  }

  showFarmers(): void {
    const farmersModal = document.getElementById('farmersModal');
    if (farmersModal) {
      const modal = bootstrap.Modal.getInstance(farmersModal) || new bootstrap.Modal(farmersModal);
      modal.show();
    }
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
