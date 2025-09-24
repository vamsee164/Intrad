import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BuyerComponent } from '../APU/buyer/buyer.component';
import { SellerComponent } from '../APU/seller/seller.component';
import { HomepageComponent } from '../FPC/Homepage/homepage.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, BuyerComponent, SellerComponent, HomepageComponent],
  template: `
    <div class="dashboard-header">
      <h2>Admin Dashboard - Full Access</h2>
      <button (click)="logout()" class="logout-btn">Logout</button>
    </div>
    
    <div class="dashboard-tabs">
      <button (click)="activeTab = 'fpc'" [class.active]="activeTab === 'fpc'">FPC System</button>
      <button (click)="activeTab = 'buyer'" [class.active]="activeTab === 'buyer'">Buyer Form</button>
      <button (click)="activeTab = 'seller'" [class.active]="activeTab === 'seller'">Seller Form</button>
    </div>
    
    <div class="tab-content">
      <app-homepage *ngIf="activeTab === 'fpc'"></app-homepage>
      <app-buyer *ngIf="activeTab === 'buyer'"></app-buyer>
      <app-seller *ngIf="activeTab === 'seller'"></app-seller>
    </div>
  `,
  styles: [`
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #6f42c1; color: white; }
    .logout-btn { background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    .dashboard-tabs { display: flex; gap: 10px; padding: 20px; }
    .dashboard-tabs button { padding: 10px 20px; border: 1px solid #ddd; background: white; cursor: pointer; }
    .dashboard-tabs button.active { background: #6f42c1; color: white; }
    .tab-content { padding: 20px; }
  `]
})
export class AdminDashboardComponent {
  activeTab = 'fpc';

  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}