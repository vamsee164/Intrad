import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BuyerComponent } from '../APU/buyer/buyer.component';
import { SellerComponent } from '../APU/seller/seller.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, BuyerComponent, SellerComponent],
  template: `
    <div class="user-dashboard-wrapper">
      <div class="dashboard-header">
        <div class="header-left">
          <h2><i class="bi bi-grid-fill me-2 text-success"></i>User Portal</h2>
          <span class="user-role-tag">{{ currentUserRole | titlecase }}</span>
        </div>
        <div class="header-right">
          <button *ngIf="currentUserRole === 'admin'" (click)="goToControl()" class="btn-profile" style="background:#f3e8ff; color:#7c3aed; border-color:#d8b4fe;">
            <i class="bi bi-shield-lock-fill me-1"></i>Control Panel
          </button>
          <button (click)="goToProfile()" class="btn-profile">
            <i class="bi bi-person-circle me-1"></i>Profile
          </button>
          <button (click)="logout()" class="btn-logout">
            <i class="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </div>
      
      <div class="dashboard-nav-bar">
        <div class="dashboard-tabs">
          <button (click)="activeTab = 'buyer'" [class.active]="activeTab === 'buyer'">
            <i class="bi bi-basket2-fill me-2"></i>Buyer Form
          </button>
          <button (click)="activeTab = 'seller'" [class.active]="activeTab === 'seller'">
            <i class="bi bi-box-seam-fill me-2"></i>Seller Form
          </button>
        </div>
      </div>
      
      <div class="tab-content">
        <app-buyer *ngIf="activeTab === 'buyer'"></app-buyer>
        <app-seller *ngIf="activeTab === 'seller'"></app-seller>
      </div>
    </div>
  `,
  styles: [`
    .user-dashboard-wrapper {
      min-height: 100vh;
      background: #f8faf8;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #ffffff;
      border-bottom: 1.5px solid #e8eceb;
      box-shadow: 0 2px 8px rgba(45,80,22,0.04);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-left h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      color: #1e2d1e;
    }
    .user-role-tag {
      background: #dcfce7;
      color: #166534;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
    }
    .header-right {
      display: flex;
      gap: 8px;
    }
    .btn-profile, .btn-logout {
      padding: 7px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: all 0.18s ease;
    }
    .btn-profile {
      background: #eff6ff;
      color: #1d4ed8;
      border-color: #bfdbfe;
    }
    .btn-profile:hover {
      background: #dbeafe;
    }
    .btn-logout {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fecaca;
    }
    .btn-logout:hover {
      background: #fee2e2;
    }
    .tab-content {
      padding: 0;
    }
    /* Suppress inner component's top bar — UserDashboard has its own header */
    app-buyer .top-bar,
    app-seller .top-bar {
      display: none !important;
    }
    /* Tab navigation styles */
    .dashboard-nav-bar {
      display: flex;
      justify-content: center;
      padding: 16px 24px 0;
    }
    .dashboard-tabs {
      display: flex;
      gap: 8px;
      background: #e8eceb;
      padding: 4px;
      border-radius: 14px;
    }
    .dashboard-tabs button {
      padding: 10px 24px;
      border: none;
      border-radius: 10px;
      background: transparent;
      font-size: 14px;
      font-weight: 700;
      color: #4b5563;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .dashboard-tabs button.active {
      background: #2d5016;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(45,80,22,0.25);
    }
    @media (max-width: 600px) {
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .header-right {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  activeTab: 'buyer' | 'seller' = 'buyer';
  currentUserRole: string = 'user';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Subscribe reactively so role changes (e.g. after token refresh) update the tab
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user?.role) {
          this.currentUserRole = user.role;
          if (user.role === 'seller') {
            this.activeTab = 'seller';
          } else {
            this.activeTab = 'buyer';
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToControl(): void {
    this.router.navigate(['/control']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout('/homepage');
  }
}