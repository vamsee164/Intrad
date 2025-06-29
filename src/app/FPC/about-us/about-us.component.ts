import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule], // Import CommonModule here for *ngFor
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.css',
})
export class AboutUsComponent {
  // Array to hold team member data
  teamMembers = [
    {
      name: 'D Uday Kumar',
      role: 'Founder',
      imageUrl: 'assets/images/uday.png', // Dummy image
    },
   
  ];

  constructor() {}

  ngOnInit(): void {
    // Initialization logic can go here if needed
  }
}
