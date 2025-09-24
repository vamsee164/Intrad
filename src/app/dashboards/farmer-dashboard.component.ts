import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HomepageComponent } from '../FPC/Homepage/homepage.component';

@Component({
  selector: 'app-farmer-dashboard',
  standalone: true,
  imports: [CommonModule, HomepageComponent],
  template: `
    <div class="dashboard-header">
      <h2>Farmer Dashboard - FPC System</h2>
      <button (click)="logout()" class="logout-btn">Logout</button>
    </div>
    
    <div class="dashboard-content">
      <app-homepage></app-homepage>
    </div>
  `,
  styles: [`
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #28a745; color: white; }
    .logout-btn { background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    .dashboard-content { padding: 20px; }
  `]
})
export class FarmerDashboardComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}