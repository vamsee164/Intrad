import { isPlatformBrowser, CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
@Component({
  selector: 'app-service-info',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './service-info.component.html',
  styleUrl: './service-info.component.css',
})
export class ServiceInfoComponent {
  // Lease form data
  leaseData: LeaseData = {
    landType: '',
    soilType: '',
    areaAcres: null,
    waterSource: '',
    totalYears: null,
    roadDistance: null,
  };

  // Rent form data
  rentData: RentData = {
    equipmentType: '',
    duration: '',
  };

  @ViewChild('leaseForm') leaseHtmlForm!: NgForm;
  @ViewChild('rentForm') rentHtmlForm!: NgForm;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Re-initialize Bootstrap's tab functionality if needed
      const firstTabEl = this.document.querySelector(
        '#v-pills-tab button:first-child'
      );
      if (firstTabEl) {
        // new bootstrap.Tab(firstTabEl).show(); // Manually show the first tab if not active by default
      }

      // Add change listener for water source if it exists
      const leaseWaterSourceSelect = this.document.getElementById(
        'leaseWaterSource'
      ) as HTMLSelectElement;
      if (leaseWaterSourceSelect) {
        leaseWaterSourceSelect.addEventListener('change', () =>
          this.toggleLeaseWaterSourceQuestions()
        );
        // Initial call to set correct display on load
        this.toggleLeaseWaterSourceQuestions();
      }
    }
  }

  /**
   * Toggles the visibility of water source specific questions in the lease form
   * based on the selected water source type.
   */
  toggleLeaseWaterSourceQuestions(): void {
    // Angular's *ngIf handles this directly in the template based on leaseData.waterSource
    // No direct DOM manipulation like 'style.display = "block"' is needed here when using [(ngModel)] and *ngIf.
    // However, if some logic requires it, you can keep the references but modify based on Angular's data.
    // The previous implementation used direct DOM manipulation. With Angular's *ngIf,
    // these elements will simply not be in the DOM unless their condition is met.
    // So, this method mostly serves to trigger change detection if needed for non-Angular elements,
    // but the *ngIf on the HTML handles the display directly.
  }

  /**
   * Handles Lease Application Form submission.
   */
  handleLeaseSubmission(): void {
    console.log('Lease Form Submitted:', this.leaseData);
    // In a real application, send this.leaseData to your backend API.

    // Show success modal
    const successModalElement = this.document.getElementById(
      'successModalDashboard'
    ); // Use a distinct ID
    if (successModalElement) {
      const successModal =
        bootstrap.Modal.getInstance(successModalElement) ||
        new bootstrap.Modal(successModalElement);
      this.document.getElementById('successModalLabelDashboard')!.textContent =
        'Lease Inquiry Success';
      (
        this.document.querySelector(
          '#successModalDashboard .modal-body'
        ) as HTMLElement
      ).textContent = 'Your lease inquiry has been submitted successfully!';
      successModal.show();
    }
    this.leaseHtmlForm.resetForm(); // Reset the form using NgForm reference
  }

  /**
   * Handles Rent Equipment/Machinery Form submission.
   */
  handleRentSubmission(): void {
    console.log('Rent Form Submitted:', this.rentData);
    // In a real application, send this.rentData to your backend API.

    // Show success modal
    const successModalElement = this.document.getElementById(
      'successModalDashboard'
    ); // Use a distinct ID
    if (successModalElement) {
      const successModal =
        bootstrap.Modal.getInstance(successModalElement) ||
        new bootstrap.Modal(successModalElement);
      this.document.getElementById('successModalLabelDashboard')!.textContent =
        'Rent Inquiry Success';
      (
        this.document.querySelector(
          '#successModalDashboard .modal-body'
        ) as HTMLElement
      ).textContent = 'Your rent inquiry has been submitted successfully!';
      successModal.show();
    }
    this.rentHtmlForm.resetForm(); // Reset the form using NgForm reference
  }
}
