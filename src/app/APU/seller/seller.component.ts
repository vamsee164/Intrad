// src/app/seller/seller.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // For *ngIf, *ngFor
import { FormsModule, NgForm } from '@angular/forms'; // For [(ngModel)]

interface SellerFormData {
  sellerName: string;
  contactNo: string;
  email: string;
  rawMaterialType: string;
  quantity: string;
  location: string;
  pricePerUnit: number | null;
  harvestDate: string;
  qualityGrade: string;
}

@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller.component.html',
  styleUrls: ['./seller.component.css'],
})
export class SellerComponent implements OnInit {
  formData: SellerFormData = {
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

  constructor() {}

  ngOnInit(): void {}

  /**
   * Handles the submission of the seller form.
   * Logs the form data to the console.
   */
  onSubmit(): void {
    const submissionData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...this.formData,
      status: 'active'
    };
    
    console.log('Seller Form Submitted:', submissionData);
    // In a real application, send submissionData to your backend API
    alert('Your seller offer has been submitted! Check console for details.');
    this.resetForm();
  }

  /**
   * Resets the form fields after submission.
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
  }
}
