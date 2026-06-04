import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Job {
  id: number;
  title: string;
  location: string;
  domain: string;
  type: string;
  experience: string;
  description: string;
  posted: string;
}

@Component({
  selector: 'app-career',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './career.component.html',
  styleUrl: './career.component.css',
})
export class CareerComponent {
  selectedLocation = '';
  selectedDomain = '';
  showSearchResults = false;
  foundJobs: Job[] = [];
  isSearching = false;
  
  locations = ['Anantapur', 'Kadapa','Tirupathi'];
  domains = ['Software Development', 'R&D', 'Marketing', 'Sales', 'Labour','Agricultural-Scientist','Soil test assistance','Electrican','Security Guard','Driver'];

  // Mock job database
  private allJobs: Job[] = [
    { id: 1, title: 'Senior Software Developer', location: 'Anantapur', domain: 'Software Development', type: 'Full-time', experience: '3-5 years', description: 'Develop and maintain agricultural software solutions', posted: '2 days ago' },
    { id: 2, title: 'Agricultural Scientist', location: 'Kadapa', domain: 'Agricultural-Scientist', type: 'Full-time', experience: '5+ years', description: 'Research and develop new farming techniques', posted: '1 week ago' },
    { id: 3, title: 'Soil Test Assistant', location: 'Tirupathi', domain: 'Soil test assistance', type: 'Full-time', experience: '1-2 years', description: 'Assist in soil testing and analysis', posted: '3 days ago' },
    { id: 4, title: 'Marketing Manager', location: 'Anantapur', domain: 'Marketing', type: 'Full-time', experience: '3-5 years', description: 'Lead marketing campaigns for agricultural products', posted: '5 days ago' },
    { id: 5, title: 'R&D Engineer', location: 'Kadapa', domain: 'R&D', type: 'Full-time', experience: '2-4 years', description: 'Research and develop agricultural equipment', posted: '1 week ago' },
    { id: 6, title: 'Sales Executive', location: 'Tirupathi', domain: 'Sales', type: 'Full-time', experience: '1-3 years', description: 'Sell agricultural products to farmers', posted: '4 days ago' },
    { id: 7, title: 'Farm Labour', location: 'Anantapur', domain: 'Labour', type: 'Contract', experience: 'Fresher', description: 'Assist in daily farm operations', posted: '2 days ago' },
    { id: 8, title: 'Electrician', location: 'Kadapa', domain: 'Electrican', type: 'Full-time', experience: '2-3 years', description: 'Maintain electrical systems in agricultural facilities', posted: '6 days ago' },
    { id: 9, title: 'Security Guard', location: 'Tirupathi', domain: 'Security Guard', type: 'Full-time', experience: 'Fresher', description: 'Ensure security of agricultural premises', posted: '1 day ago' },
    { id: 10, title: 'Driver', location: 'Anantapur', domain: 'Driver', type: 'Full-time', experience: '1-2 years', description: 'Transport agricultural products and personnel', posted: '3 days ago' }
  ];

  searchJobs() {
    this.isSearching = true;
    this.showSearchResults = false;
    
    // Simulate API call delay
    setTimeout(() => {
      this.foundJobs = this.allJobs.filter(job => {
        const locationMatch = !this.selectedLocation || job.location === this.selectedLocation;
        const domainMatch = !this.selectedDomain || job.domain === this.selectedDomain;
        return locationMatch && domainMatch;
      });
      
      this.showSearchResults = true;
      this.isSearching = false;
    }, 500);
  }

  resetSearch() {
    this.selectedLocation = '';
    this.selectedDomain = '';
    this.showSearchResults = false;
    this.foundJobs = [];
  }

  trackByFn(index: number, item: any): any {
    return item?.id || item || index;
  }
}
