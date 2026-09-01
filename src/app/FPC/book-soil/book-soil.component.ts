import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { GeoLocationService } from '../../services/geo-location.service';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '../../shared/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'app-book-soil',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './book-soil.component.html',
  styleUrl: './book-soil.component.css',
})
export class BookSoilComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly dbUrl = 'https://intra-d-default-rtdb.asia-southeast1.firebasedatabase.app/soilTest.json';

  @ViewChild('soilForm') soilForm!: NgForm;
  title = 'Soil Test Booking';
  currentStep = 1;

  // Soil Test Form Model
  soilTestForm = {
    farmerName: '',
    mobileNumber: '',
    village: '',

    landArea: null as number | null,
    irrigationType: '',

    currentCrop: '',
    previousCrop: '',

    sampleDate: '',
    sampleDepth: '0_15',
    fieldCondition: 'dry',

    problemDescription: ''
  };

  constructor(
    private readonly geoService: GeoLocationService,
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  isAuthenticated = false;
  currentUserRole: string | undefined;
  isSubmitting = false;
  submitSuccess = false;
  submitSuccessRef: string = '';
  submitError: string = '';

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAuthenticated = !!user;
        this.currentUserRole = user?.role;
        if (user) {
          this.soilTestForm.farmerName = user.name || '';
          this.soilTestForm.mobileNumber = user.phone || user.profileData?.mobileNo || '';
          this.soilTestForm.village = user.profileData?.village || user.location || '';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    if (this.isAuthenticated) {
      this.router.navigate([this.authService.getDashboardRoute()]);
    } else {
      this.router.navigate(['/homepage']);
    }
  }

  goToDashboard(): void {
    this.router.navigate([this.authService.getDashboardRoute()]);
  }

  /** Step navigation and checks */
  nextStep(): void {
    if (this.currentStep === 1) {
      if (this.isStep1Valid()) {
        this.currentStep = 2;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.touchStep1Controls();
      }
    } else if (this.currentStep === 2) {
      if (this.isStep2Valid()) {
        this.currentStep = 3;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.touchStep2Controls();
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  isStep1Valid(): boolean {
    return !!(
      this.soilTestForm.farmerName?.trim() &&
      this.soilTestForm.mobileNumber &&
      /^[0-9]{10}$/.test(this.soilTestForm.mobileNumber) &&
      this.soilTestForm.village?.trim()
    );
  }

  isStep2Valid(): boolean {
    return !!(
      this.soilTestForm.landArea &&
      this.soilTestForm.landArea > 0 &&
      this.soilTestForm.irrigationType &&
      this.soilTestForm.currentCrop
    );
  }

  isStep3Valid(): boolean {
    return !!this.soilTestForm.sampleDate;
  }

  private touchStep1Controls(): void {
    this.soilForm.controls['farmerName']?.markAsTouched();
    this.soilForm.controls['mobileNumber']?.markAsTouched();
    this.soilForm.controls['village']?.markAsTouched();
  }

  private touchStep2Controls(): void {
    this.soilForm.controls['landArea']?.markAsTouched();
    this.soilForm.controls['irrigationType']?.markAsTouched();
    this.soilForm.controls['currentCrop']?.markAsTouched();
  }

  /**
   * Handle form submission
   */
  onPhoneInput(event: any): void {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.soilForm.invalid || !this.isStep1Valid() || !this.isStep2Valid() || !this.isStep3Valid()) {
      this.soilForm.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.submitError = '';
    try {
      const location = await this.geoService.getCurrentLocation();
      const payload = {
        ...this.soilTestForm,
        location,
        createdAt: new Date().toISOString(),
        status: 'REQUESTED'
      };
      this.http.post(this.dbUrl, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.submitSuccessRef = this.soilTestForm.farmerName || 'Farmer';
          this.submitSuccess = true;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: () => {
          this.isSubmitting = false;
          this.submitError = 'Unable to submit request. Please check your connection and try again.';
        }
      });
    } catch {
      this.isSubmitting = false;
      this.submitError = 'Unable to get your location. Please enable GPS and try again.';
    }
  }

  /**
   * Reset form after submit
   */
  resetForm(): void {
    this.currentStep = 1;
    this.submitSuccess = false;
    this.submitError = '';
    this.submitSuccessRef = '';
    this.soilTestForm = {
      farmerName: '',
      mobileNumber: '',
      village: '',

      landArea: null,
      irrigationType: '',

      currentCrop: '',
      previousCrop: '',

      sampleDate: '',
      sampleDepth: '0_15',
      fieldCondition: 'dry',

      problemDescription: ''
    };
  }
}
