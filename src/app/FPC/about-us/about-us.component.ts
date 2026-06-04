import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface TeamMember {
  name: string;
  role: string;
  imageUrl: string;
}

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.css',
})
export class AboutUsComponent {
  readonly teamMembers: TeamMember[] = [
    { name: 'D Uday Kumar',         role: 'Founder',      imageUrl: 'assets/images/uday.jpeg' },
    { name: 'B Vamsee Dhara Reddy', role: 'CTO',          imageUrl: 'assets/images/vamshi.jpeg' },
    { name: 'Bhavani Hari',         role: 'Director CMO', imageUrl: 'assets/images/hari.jpeg' },
    { name: 'Chekuri Naresh Babu',  role: 'Director',     imageUrl: 'assets/images/naresh.jpeg' },
    { name: 'Singamala Siva Prasad',role: 'Director',     imageUrl: 'assets/images/siva.png' },
  ];

  trackByFn(index: number, item: any): any {
    return item?.name || index;
  }
}
