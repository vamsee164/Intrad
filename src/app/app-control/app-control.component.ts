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
  description: string;
  icon: string;
  buttonText: string;
  buttonClass: string;
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
  private destroy$ = new Subject<void>();
  currentUser: User | null = null;
  availableApps: AppCard[] = [];
  currentView: ViewType = 'control';

  private readonly appConfigs: AppCard[] = [
    {
      id: 'fpc',
      title: 'Farmer System',
      description: 'Farmer Producer Company Management',
      icon: '🌾',
      buttonText: 'Launch Farmer',
      buttonClass: 'fpc-btn',
      action: () => this.launchApp('fpc')
    },
    {
      id: 'apu',
      title: 'APU System', 
      description: 'Agricultural Processing Unit',
      icon: '🏭',
      buttonText: 'Launch APU',
      buttonClass: 'apu-btn',
      action: () => this.launchApp('apu')
    },
    {
      id: 'admin',
      title: 'Admin Portal',
      description: 'System Administration',
      icon: '⚙️',
      buttonText: 'Launch Admin',
      buttonClass: 'admin-btn',
      action: () => this.setActiveView('admin')
    }
  ];

  constructor(
    private readonly authService: AuthService, 
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
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

  navigateToFarmers(): void {
    // This will be handled by the admin dashboard component
  }

  navigateToBuyers(): void {
    // This will be handled by the admin dashboard component
  }

  navigateToReports(): void {
    // This will be handled by the admin dashboard component
  }

  goBackToControl(): void {
    this.setActiveView('control');
  }

  private updateAvailableApps(): void {
    if (!this.currentUser) {
      this.availableApps = [];
      return;
    }

    this.availableApps = this.appConfigs.filter(app => {
      switch (app.id) {
        case 'fpc': return this.authService.isAuthenticated();
        case 'apu': return this.hasRole('admin') || this.hasRole('farmer');
        case 'admin': return this.hasRole('admin');
        default: return false;
      }
    });
  }

  private hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  launchApp(appId: string): void {
    switch(appId) {
      case 'fpc':
        this.router.navigate(['/farmer']);
        break;
      case 'apu':
        this.router.navigate(['/apu']);
        break;
      default:
        this.router.navigate([`/${appId}`]);
    }
  }

  logout(): void {
    this.authService.logout('/homepage');
  }

  trackByFn(index: number, item: any): any {
    return item?.id || index;
  }
}