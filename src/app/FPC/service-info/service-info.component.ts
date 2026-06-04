import { isPlatformBrowser, CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  Inject,
  PLATFORM_ID,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, User } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';

// To interact with Bootstrap Modals via JS
declare var bootstrap: any;

interface LeaseData {
  landType: string;
  soilType: string;
  areaAcres: number | null; // Changed to number
  waterSource: string;
  totalYears: number | null; // Changed to number
  roadDistance: number | null; // Changed to number
  borewellCount?: number | null; // Changed to number
  canalWaterDuration?: string;
  wellWaterAcres?: number | null; // Changed to number
}

interface RentData {
  equipmentType: string;
  duration: string;
}

interface SoilTestData {
  farmerName: string;
  mobileNumber: string;
  village: string;
  landArea: number | null;
  irrigationType: string;
  currentCrop: string;
  previousCrop: string;
  sampleDate: string;
  problemDescription: string;
}

@Component({
  selector: 'app-service-info',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './service-info.component.html',
  styleUrl: './service-info.component.css',
})
export class ServiceInfoComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  currentUser: User | null = null;
  
  // Modal text bindings (removes direct DOM manipulation)
  modalTitle = '';
  modalBody = '';

  // Lease form data
  leaseData: LeaseData = {
    landType: '',
    soilType: '',
    areaAcres: null,
    waterSource: '',
    totalYears: null,
    roadDistance: null,
  };
  isBasicExpanded = false;
  isPremiumExpanded = false;
  isMarketingExpanded = false;

  // Rent form data
  rentData: RentData = {
    equipmentType: '',
    duration: '',
  };

  // Soil test form data
  soilTestData: SoilTestData = {
    farmerName: '',
    mobileNumber: '',
    village: '',
    landArea: null,
    irrigationType: '',
    currentCrop: '',
    previousCrop: '',
    sampleDate: '',
    problemDescription: ''
  };

  @ViewChild('leaseForm') leaseHtmlForm!: NgForm;
  @ViewChild('rentForm') rentHtmlForm!: NgForm;
  @ViewChild('soilForm') soilHtmlForm!: NgForm;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private authService: AuthService,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        
        // Pre-populate soil test form with user data
        if (user) {
          this.soilTestData.farmerName = user.name || '';
          this.soilTestData.mobileNumber = user.phone || user.profileData?.mobileNo || user.profileData?.phone || '';
          this.soilTestData.village = user.profileData?.village || user.location || '';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggles the visibility of water source specific questions in the lease form
   * based on the selected water source type.
   */
  toggleLeaseWaterSourceQuestions(): void {
    // Angular's *ngIf handles this directly in the template based on leaseData.waterSource
  }

  /**
   * Handles Lease Application Form submission.
   */
  handleLeaseSubmission(): void {
    if (!this.currentUser || this.leaseHtmlForm.invalid) return;
    
    const submissionData = {
      ...this.leaseData,
      userId: this.currentUser.id,
      email: this.currentUser.email,
    };

    this.firebaseService.createLeaseApplication(submissionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Lease application created:', response);
          
          this.modalTitle = 'Lease Application Submitted';
          this.modalBody = 'Your lease application has been submitted successfully!';

          // Show success modal
          const successModalElement = this.document.getElementById('successModalDashboard');
          if (successModalElement) {
            const successModal = bootstrap.Modal.getInstance(successModalElement) || new bootstrap.Modal(successModalElement);
            successModal.show();
          }
          
          this.leaseHtmlForm.resetForm();
        },
        error: (error) => {
          console.error('Error submitting lease application:', error);
          alert('Failed to submit lease application. Please try again.');
        }
      });
  }

  /**
   * Handles Rent Equipment/Machinery Form submission.
   */
  handleRentSubmission(): void {
    if (!this.currentUser) return;

    const submissionData = {
      ...this.rentData,
      userId: this.currentUser.id,
      email: this.currentUser.email,
    };
    console.log('Rent Form Submitted:', submissionData);
    // In a real application, send this.rentData to your backend API.

    this.modalTitle = 'Rent Inquiry Success';
    this.modalBody = 'Your rent inquiry has been submitted successfully!';

    // Show success modal
    const successModalElement = this.document.getElementById('successModalDashboard');
    if (successModalElement) {
      const successModal = bootstrap.Modal.getInstance(successModalElement) || new bootstrap.Modal(successModalElement);
      successModal.show();
    }
    this.rentHtmlForm.resetForm(); // Reset the form using NgForm reference
  }

  /**
   * Handles Soil Test Form submission.
   */
  handleSoilTestSubmission(): void {
    if (!this.currentUser || this.soilHtmlForm.invalid) return;
    
    const submissionData = {
      ...this.soilTestData,
      userId: this.currentUser.id,
      email: this.currentUser.email,
      submittedAt: new Date().toISOString()
    };

    console.log('Soil Test Form Submitted:', submissionData);
    // In a real application, send this data to your backend API.

    this.modalTitle = 'Soil Test Request Submitted';
    this.modalBody = 'Your soil test request has been submitted successfully!';

    // Show success modal
    const successModalElement = this.document.getElementById('successModalDashboard');
    if (successModalElement) {
      const successModal = bootstrap.Modal.getInstance(successModalElement) || new bootstrap.Modal(successModalElement);
      successModal.show();
    }
    
    this.soilHtmlForm.resetForm();
  }

  logout(): void {
    this.authService.logout('/homepage');
  }
}
