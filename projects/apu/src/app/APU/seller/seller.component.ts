// src/app/seller/seller.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // For *ngIf, *ngFor
import { FormsModule, NgForm } from '@angular/forms'; // For [(ngModel)]

interface SellerFormData {
  sellerName: string;
  contactNo: string;
  rawMaterialType: string;
  quantity: string;
  location: string;
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
    rawMaterialType: '',
    quantity: '',
    location: '',
  };

  constructor() {}

  ngOnInit(): void {}

  /**
   * Handles the submission of the seller form.
   * Logs the form data to the console.
   */
  onSubmit(): void {
    console.log('Seller Form Submitted!', this.formData);
    // In a real application, you would send this.formData to a backend.
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
      rawMaterialType: '',
      quantity: '',
      location: '',
    };
  }
}
