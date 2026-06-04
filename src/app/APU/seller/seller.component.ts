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
  
  // View management
  currentView: 'form' | 'confirmation' = 'form';
  submittedData: any = null;
  showLastSubmission: boolean = false;

  currentUser: User | null = null;
  private readonly destroy$ = new Subject<void>();
  isSubmitting: boolean = false;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  goToProfile(): void { this.router.navigate(['/profile']); }
  logout(): void { this.authService.logout('/homepage'); }
  backToAPU(): void { this.router.navigate(['/apu']); }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
    this.loadLastSubmission();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Load last submission from localStorage
   */
  loadLastSubmission(): void {
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
    
    console.log('Submitting Seller offer...');
    this.isSubmitting = true;
    
    this.firebaseService.createSellerForm(submissionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          // Save to localStorage for future reference
          localStorage.setItem('lastSellerSubmission', JSON.stringify(submissionData));
          
          // Store submitted data and show confirmation
          this.submittedData = submissionData;
          this.currentView = 'confirmation';
          
          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Failed to submit seller form:', error);
          alert('Failed to submit offer. Please try again.');
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
   * Reset form data
   */
  resetForm(): void {
    this.formData = {
      sellerName: '',
      contactNo: '',
      email: '',
      rawMaterialType: '',
      quantity: '',
      location: '',
      pricePerUnit: null,
      harvestDate: '',
      qualityGrade: ''
    };
    this.submittedData = null;
  }
}
