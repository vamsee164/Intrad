import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  newsletterEmail = '';
  
  constructor() {}
  
  ngOnInit(): void {
    // Initialization logic for the footer component can go here if needed.
  }
  
  onNewsletterSubmit(): void {
    console.log('Newsletter subscription:', this.newsletterEmail);
    alert('Thank you for subscribing to our newsletter!');
    this.newsletterEmail = '';
  }
}
