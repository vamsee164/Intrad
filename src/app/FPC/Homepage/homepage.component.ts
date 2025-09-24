// src/app/homepage/homepage.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // Import HttpClient

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
  @ViewChild('signupForm') signupHtmlForm!: NgForm;

  private apiKey = '93e63dcc1fb38ed986a59514d85dbbd1';
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
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
    newThisMonth: 45,
  };

  setComingSoonFeature(feature: string): void {
    this.selectedFeature = feature;
  }

  /**
   * Prompts the user for their current location and returns the coordinates.
   * Uses a Promise to handle asynchronous geolocation API calls.
   */
  getCurrentLocation(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          (error) => {
            // Reject the promise if geolocation fails
            reject(error);
          }
        );
      } else {
        // Reject the promise if geolocation is not supported
        reject(new Error('Geolocation is not supported by this browser.'));
      }
    });
  }

  async showWeather(): Promise<void> {
    try {
      const { lat, lon } = await this.getCurrentLocation();
      const requestUrl = `${this.apiUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;

      this.http.get(requestUrl).subscribe({
        next: (data: any) => {
          this.weatherData = {
            location: data.name,
            temperature: Math.round(data.main.temp),
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
          };
          this.selectedFeature = 'Weather';

          const weatherModal = document.getElementById('weatherModal');
          if (weatherModal) {
            const modal =
              bootstrap.Modal.getInstance(weatherModal) ||
              new bootstrap.Modal(weatherModal);
            modal.show();
          }
        },
        error: (error) => {
          console.error('Error fetching weather data:', error);
          this.showErrorModal('Error fetching weather data.');
        },
      });
    } catch (error: any) {
      console.error('Geolocation error:', error);
      this.showErrorModal(
        'Could not get your location. Please enable location services in your browser.'
      );
    }
  }

  // Helper function to show a generic error modal
  private showErrorModal(message: string): void {
    this.weatherData = {
      location: 'Error',
      temperature: 'N/A',
      description: message,
      humidity: 'N/A',
      windSpeed: 'N/A',
    };
    this.selectedFeature = 'Weather';
    const weatherModal = document.getElementById('weatherModal');
    if (weatherModal) {
      const modal =
        bootstrap.Modal.getInstance(weatherModal) ||
        new bootstrap.Modal(weatherModal);
      modal.show();
    }
  }

  showFarmers(): void {
    const farmersModal = document.getElementById('farmersModal');
    if (farmersModal) {
      const modal =
        bootstrap.Modal.getInstance(farmersModal) ||
        new bootstrap.Modal(farmersModal);
      modal.show();
    }
  }
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
