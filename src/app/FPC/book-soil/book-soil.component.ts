import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-soil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './book-soil.component.html',
  styleUrl: './book-soil.component.css',
})
export class BookSoilComponent {
  // If your component is BookSoilComponent, this should be export class BookSoilComponent
  title = 'Soil Test Booking';

  // Model for the form data, initialized with empty strings
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    streetAddress1: '',
    streetAddress2: '',
    city: '',
    region: '', // Represents Region/State/Province
    postalCode: '',
    country: '',
    specialInstructions: '',
  };

  // List of countries for the dropdown select element
  countries: string[] = [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'India',
    'Brazil',
    'Japan',
    'China',
    'Mexico',
    'South Africa',
    'Egypt',
    'Argentina',
    'New Zealand',
    'Singapore',
    'Malaysia',
    'Indonesia',
  ];

  constructor() {
    // Constructor is called when the component is created.
    // Use it for dependency injection, not heavy logic.
  }

  /**
   * Handles the form submission event.
   * This method is triggered when the form's (ngSubmit) event fires.
   * It logs the current form data to the console.
   * In a real-world application, you would typically send this.formData to a backend API.
   */
  onSubmit(): void {
    console.log('Form Submitted!', this.formData);
    // In a production application, you would send this.formData to a service,
    // which would then make an HTTP request to your backend.
    // Example: this.someService.submitSoilTestData(this.formData).subscribe(response => { /* handle response */ });

    // For demonstration, we'll use a simple alert and then reset the form.
    alert(
      'Soil Test Request Submitted! Check your browser console for details.'
    );
    this.resetForm(); // Call resetForm to clear the input fields
  }

  /**
   * Resets the form data to its initial empty state.
   * This clears all the input fields bound by [(ngModel)] after submission.
   */
  resetForm(): void {
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      streetAddress1: '',
      streetAddress2: '',
      city: '',
      region: '',
      postalCode: '',
      country: '',
      specialInstructions: '',
    };
  }
}
