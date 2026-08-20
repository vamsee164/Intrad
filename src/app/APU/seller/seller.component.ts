import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller.component.html',
  styleUrls: ['./seller.component.css']
})
export class SellerComponent implements OnInit, OnDestroy {
  @ViewChild('sellerForm') sellerForm!: NgForm;

  formData = {
    sellerName: '',
    contactNo: '',
    email: '',
    rawMaterialType: '',
    quantity: '',
    location: '',
    pricePerUnit: null as number | null,
    harvestDate: '',
    qualityGrade: ''
  };

  // View management: 'form' | 'confirmation' | 'history'
  currentView: 'form' | 'confirmation' | 'history' = 'form';
  submittedData: any = null;
  showLastSubmission: boolean = false;

  // Offer history
  offerHistory: any[] = [];
  isLoadingHistory = false;
  historyError: string | null = null;
  expandedOfferId: string | null = null;

  currentUser: User | null = null;
  private readonly destroy$ = new Subject<void>();
  isSubmitting: boolean = false;
  submitError: string = '';

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  goToProfile(): void { this.router.navigate(['/profile']); }
  logout(): void { this.authService.logout('/homepage'); }
  backToAPU(): void { this.router.navigate(['/apu']); }
  goToControl(): void { this.router.navigate(['/control']); }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.bindUserData(user);
          this.loadDatabaseData(user);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Bind user details from AuthService/profileData into form fields
   */
  private bindUserData(user: User): void {
    const profile = user.profileData || {};

    if (!this.formData.sellerName) {
      this.formData.sellerName = user.name || profile.name || '';
    }

    if (!this.formData.email) {
      this.formData.email = user.email || profile.personalEmail || profile.email || '';
    }

    if (!this.formData.contactNo) {
      this.formData.contactNo = user.phone || profile.mobileNo || profile.phone || '';
    }

    if (!this.formData.location) {
      const location = user.location || (profile.village
        ? (profile.mandal ? `${profile.village}, ${profile.mandal}` : profile.village)
        : (profile.location || profile.address || ''));
      this.formData.location = location;
    }

    if (!this.formData.rawMaterialType && profile.typicalCrops) {
      const crops = profile.typicalCrops;
      this.formData.rawMaterialType = Array.isArray(crops) ? (crops[0] || '') : String(crops);
    }
  }

  /**
   * Load submissions and complete profile data from Firebase Realtime Database
   */
  private loadDatabaseData(user: User): void {
    const userEmail = user.email || user.profileData?.personalEmail;
    const userPhone = user.phone || user.profileData?.mobileNo;

    // Load seller form submissions from database
    if (userEmail || userPhone) {
      this.firebaseService.getSellerFormsByEmail(userEmail, userPhone)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (submissions: any[]) => {
            this.offerHistory = submissions || [];
            if (this.offerHistory.length > 0) {
              const latest = this.offerHistory[0];
              this.submittedData = latest;
              this.showLastSubmission = true;

              // Pre-fill any remaining empty fields from the latest submission
              if (!this.formData.location && latest.location) {
                this.formData.location = latest.location;
              }
              if (!this.formData.rawMaterialType && latest.rawMaterialType) {
                this.formData.rawMaterialType = latest.rawMaterialType;
              }
              if (!this.formData.qualityGrade && latest.qualityGrade) {
                this.formData.qualityGrade = latest.qualityGrade;
              }
              if (this.formData.pricePerUnit == null && latest.pricePerUnit != null) {
                this.formData.pricePerUnit = latest.pricePerUnit;
              }
            } else {
              this.loadLastSubmissionFromLocal();
            }
          },
          error: (err) => {
            console.warn('[SellerComponent] Could not fetch database submissions:', err);
            this.loadLastSubmissionFromLocal();
          }
        });
    } else {
      this.loadLastSubmissionFromLocal();
    }

    // If name or phone is still missing, fetch user profile directly from RTDB
    if ((!this.formData.sellerName || !this.formData.contactNo) && user.id) {
      this.firebaseService.getUser(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (dbUser) => {
            if (dbUser) {
              if (!this.formData.sellerName) {
                this.formData.sellerName = dbUser.name || '';
              }
              if (!this.formData.contactNo) {
                this.formData.contactNo = dbUser.mobileNo || dbUser.phone || '';
              }
              if (!this.formData.location) {
                this.formData.location = dbUser.village
                  ? (dbUser.mandal ? `${dbUser.village}, ${dbUser.mandal}` : dbUser.village)
                  : (dbUser.location || '');
              }
              if (!this.formData.rawMaterialType && dbUser.typicalCrops) {
                const crops = dbUser.typicalCrops;
                this.formData.rawMaterialType = Array.isArray(crops) ? (crops[0] || '') : String(crops);
              }
            }
          },
          error: (err) => {
            console.warn('[SellerComponent] User lookup error:', err);
          }
        });
    }
  }

  /**
   * Fallback: load last submission from localStorage
   */
  private loadLastSubmissionFromLocal(): void {
    const lastSubmission = localStorage.getItem('lastSellerSubmission');
    if (lastSubmission) {
      try {
        this.submittedData = JSON.parse(lastSubmission);
        this.showLastSubmission = true;
      } catch (error) {
        console.error('Error loading last submission:', error);
      }
    }
  }

  /**
   * Toggle last submission visibility
   */
  toggleLastSubmission(): void {
    this.showLastSubmission = !this.showLastSubmission;
  }

  /**
   * Toggle expanded detail for an offer card.
   */
  toggleOfferDetail(offerId: string): void {
    this.expandedOfferId = this.expandedOfferId === offerId ? null : offerId;
  }

  backToFormFromHistory(): void {
    this.currentView = 'form';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewHistory(): void {
    this.currentView = 'history';
    this.isLoadingHistory = true;
    this.historyError = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const userEmail = this.currentUser?.email || this.currentUser?.profileData?.personalEmail;
    const userPhone = this.currentUser?.phone || this.currentUser?.profileData?.mobileNo;

    this.firebaseService.getSellerFormsByEmail(userEmail, userPhone)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (offers: any[]) => {
          this.offerHistory = offers || [];
          this.isLoadingHistory = false;
        },
        error: (_err: any) => {
          this.historyError = 'Failed to load offer history. Please try again.';
          this.isLoadingHistory = false;
        }
      });
  }

  onPhoneInput(event: any): void {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }
  }

  onSubmit(): void {
    if (this.sellerForm.invalid) {
      this.sellerForm.form.markAllAsTouched();
      return;
    }

    const submissionData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...this.formData,
      status: 'pending'
    };

    this.isSubmitting = true;

    this.firebaseService.createSellerForm(submissionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_response) => {
          this.isSubmitting = false;
          this.submitError = '';
          // Save to localStorage for future reference
          localStorage.setItem('lastSellerSubmission', JSON.stringify(submissionData));

          // Store submitted data and update history
          this.submittedData = submissionData;
          this.offerHistory.unshift(submissionData);
          this.currentView = 'confirmation';

          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (_error: any) => {
          this.isSubmitting = false;
          this.submitError = 'Failed to submit offer. Please check your connection and try again.';
        }
      });
  }

  /**
   * Go back to form view
   */
  backToForm(): void {
    this.currentView = 'form';
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Submit another offer
   */
  submitAnother(): void {
    this.currentView = 'form';
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Reset form data while retaining bound seller profile information
   */
  resetForm(): void {
    const user = this.currentUser;
    const profile = user?.profileData || {};
    const userLocation = user?.location || (profile.village
      ? (profile.mandal ? `${profile.village}, ${profile.mandal}` : profile.village)
      : (profile.location || ''));
    const typicalCrop = profile.typicalCrops
      ? (Array.isArray(profile.typicalCrops) ? profile.typicalCrops[0] : profile.typicalCrops)
      : '';

    this.formData = {
      sellerName: user?.name || profile.name || '',
      contactNo: user?.phone || profile.mobileNo || profile.phone || '',
      email: user?.email || profile.personalEmail || profile.email || '',
      rawMaterialType: typicalCrop || '',
      quantity: '',
      location: userLocation || '',
      pricePerUnit: null,
      harvestDate: '',
      qualityGrade: ''
    };
    this.submittedData = null;
    this.submitError = '';
  }

  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  }

  getStatusIcon(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'bi-check-circle-fill';
      case 'rejected': return 'bi-x-circle-fill';
      default: return 'bi-hourglass-split';
    }
  }

  trackByOfferId(index: number, offer: any): any {
    return offer?.id || offer?.formId || index;
  }
}
