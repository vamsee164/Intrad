import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminDashboardComponent } from './admin-dashboard.component';

type ViewType = 'control' | 'admin';

interface AppCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  badgeText?: string;
  badgeClass?: string;
  buttonText: string;
  buttonClass: string;
  rolesAllowed: string[];
  action: () => void;
}

@Component({
  selector: 'app-control',
  standalone: true,
  imports: [CommonModule, AdminDashboardComponent],
  templateUrl: './app-control.component.html',
  styleUrls: ['./app-control.component.css', './admin-dashboard.component.css']
})
export class AppControlComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  currentUser: User | null = null;
  availableApps: AppCard[] = [];
  currentView: ViewType = 'control';

  private readonly appConfigs: AppCard[] = [
    {
      id: 'fpc',
      title: 'Farmer Producer System',
      subtitle: 'FPC Hub',
      description: 'Manage crop listings, land lease applications, machinery bookings, and farmer profiles.',
      icon: '🌾',
      badgeText: 'FPC Production',
      badgeClass: 'badge-fpc',
      buttonText: 'Launch Farmer Portal',
      buttonClass: 'btn-fpc',
      rolesAllowed: ['admin', 'farmer'],
      action: () => this.launchApp('fpc')
    },
    {
      id: 'apu_buyer',
      title: 'APU Buyer Portal',
      subtitle: 'Processing Unit',
      description: 'Submit bulk crop purchasing demands, track sourcing inquiries, and match with verified sellers.',
      icon: '🛒',
      badgeText: 'APU Buyer',
      badgeClass: 'badge-apu-buyer',
      buttonText: 'Launch Buyer Portal',
      buttonClass: 'btn-apu-buyer',
      rolesAllowed: ['admin', 'buyer', 'user'],
      action: () => this.launchApp('apu_buyer')
    },
    {
      id: 'apu_seller',
      title: 'APU Seller Portal',
      subtitle: 'Raw Material Supply',
      description: 'Post harvest supply offers, manage agro-produce inventory, and connect directly with bulk buyers.',
      icon: '🚜',
      badgeText: 'APU Seller',
      badgeClass: 'badge-apu-seller',
      buttonText: 'Launch Seller Portal',
      buttonClass: 'btn-apu-seller',
      rolesAllowed: ['admin', 'seller', 'farmer'],
      action: () => this.launchApp('apu_seller')
    },
    {
      id: 'admin',
      title: 'Admin Management Console',
      subtitle: 'Control & Moderation',
      description: 'Master dashboard, user verification, service request approvals, soil test management & buyer matching.',
      icon: '⚙️',
      badgeText: 'Master Admin',
      badgeClass: 'badge-admin',
      buttonText: 'Open Admin Console',
      buttonClass: 'btn-admin',
      rolesAllowed: ['admin'],
      action: () => this.setActiveView('admin')
    },
    {
      id: 'reports',
      title: 'Analytics & Reports',
      subtitle: 'Business Intelligence',
      description: 'Comprehensive yield reports, demand metrics, soil test statistics, and exportable analytics.',
      icon: '📊',
      badgeText: 'Reports',
      badgeClass: 'badge-reports',
      buttonText: 'View Reports',
      buttonClass: 'btn-reports',
      rolesAllowed: ['admin'],
      action: () => this.router.navigate(['/report'])
    }
  ];

  constructor(
    private readonly authService: AuthService, 
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        this.updateAvailableApps();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveView(view: ViewType): void {
    this.currentView = view;
  }

  goBackToControl(): void {
    this.setActiveView('control');
  }

  private updateAvailableApps(): void {
    if (!this.currentUser) {
      this.availableApps = [];
      return;
    }

    const currentRole = this.currentUser.role || 'farmer';
    const effectiveRole = currentRole === 'user' ? 'buyer' : currentRole;

    // Admin has access to all cards; others get role-specific cards
    this.availableApps = this.appConfigs.filter((app) => {
      if (effectiveRole === 'admin') return true;
      return app.rolesAllowed.includes(effectiveRole);
    });
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) {
      return this.currentUser?.email?.substring(0, 2).toUpperCase() || 'ID';
    }
    const parts = this.currentUser.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  launchApp(appId: string): void {
    switch (appId) {
      case 'fpc':
        this.router.navigate(['/farmer']);
        break;
      case 'apu_buyer':
        this.router.navigate(['/apu/buyer']);
        break;
      case 'apu_seller':
        this.router.navigate(['/apu/seller']);
        break;
      case 'admin':
        this.setActiveView('admin');
        break;
      case 'reports':
        this.router.navigate(['/report']);
        break;
      default:
        this.router.navigate(['/homepage']);
    }
  }

  logout(): void {
    this.authService.logout('/homepage');
  }

  trackByFn(index: number, item: AppCard): string {
    return item?.id || String(index);
  }
}