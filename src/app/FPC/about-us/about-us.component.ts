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
      name: 'Milind Deshpande',
      role: 'CEO',
      experience: 'Experience 30+ Years',
      imageUrl: 'https://placehold.co/150x150/1a2a4b/ffffff?text=CEO', // Dummy image
    },
    {
      name: 'Uttam Mane',
      role: 'Ex.CGMT MESSOL, Advisor IT',
      experience: 'Experience 30+ Years',
      imageUrl: 'https://placehold.co/150x150/1a2a4b/ffffff?text=UTM', // Dummy image
    },
    {
      name: 'Prashant Mathur',
      role: 'Chief Impact Officer',
      experience: 'Experience 20+ Years',
      imageUrl: 'https://placehold.co/150x150/1a2a4b/ffffff?text=PM', // Dummy image
    },
    {
      name: 'Manoj Hate',
      role: 'Advisor Public Relations',
      experience: 'Experience 20+ Years',
      imageUrl: 'https://placehold.co/150x150/1a2a4b/ffffff?text=MH', // Dummy image
    },
    {
      name: 'KV Kurundkar, IAS (Retd.)',
      role: 'Advisor Govt Business',
      experience: 'Experience 33+ Years',
      imageUrl: 'https://placehold.co/150x150/1a2a4b/ffffff?text=KV+K', // Dummy image
    },
    {
      name: 'M. Ali',
      role: 'Director Strategic Alliance',
      experience: 'Experience 20+ Years',
      imageUrl: 'https://placehold.co/150x150/1a2a4b/ffffff?text=MA', // Dummy image
    },
    {
      name: 'Aditya Modi',
      role: 'Director',
      experience: 'Experience 20+ Years',
      imageUrl: 'https://placehold.co/150x150/1a2a4b/ffffff?text=AM', // Dummy image
    },
    {
      name: 'Abhijeet Deshpande',
      role: 'Project Coordinator',
      experience: 'Experience 10+ Years',
      imageUrl: 'https://placehold.co/150x150/1a2a4b/ffffff?text=AD', // Dummy image
    },
    {
      name: 'Wakal Langote',
      role: 'Director Agronomy',
      experience: 'Experience 15+ Years',
      imageUrl: 'https://placehold.co/150x150/1a2a4b/ffffff?text=WL', // Dummy image
    },
    {
      name: 'CA Deepak Zhavar',
      role: 'Director RFO & Carbon Credit',
      experience: 'Experience 15+ Years',
      imageUrl: 'https://placehold.co/150x150/1a2a4b/ffffff?text=DZ', // Dummy image
    },
    {
      name: 'Niranjan Reddy',
      role: 'Regional Director (South Zone Operations)',
      experience: 'Experience 20+ Years',
      imageUrl: 'https://placehold.co/150x150/1a2a4b/ffffff?text=NR', // Dummy image
    },
  ];

  constructor() {}

  ngOnInit(): void {
    // Initialization logic can go here if needed
  }
}
