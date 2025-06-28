import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css',
})
export class ContactUsComponent {
  // Model for the form data
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    message: '',
    phone: '',
  };

  constructor() {}

  ngOnInit(): void {
    // Initialization logic can go here if needed
  }

  /**
   * Handles the form submission.
   * Logs the form data to the console and shows an alert.
   * In a real application, this data would be sent to a backend service.
   */
  onSubmit(): void {
    console.log('Contact Form Submitted!', this.formData);
    // In a production application, you would typically send this.formData to an API
    alert('Your message has been sent! We will get in touch soon.');
    this.resetForm(); // Reset the form fields after submission
  }

  /**
   * Resets the form data to its initial empty state.
   */
  resetForm(): void {
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      message: '',
      phone: '',
    };
  }
}
