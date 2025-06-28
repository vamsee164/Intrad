import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  foundJobs: any[] = [];
  
  locations = ['Hyderabad', 'Bangalore', 'Chennai', 'Mumbai', 'Delhi'];
  domains = ['Software Development', 'Data Science', 'Marketing', 'Sales', 'HR'];

  searchJobs() {
    this.showSearchResults = true;
    this.foundJobs = [];
  }
}
