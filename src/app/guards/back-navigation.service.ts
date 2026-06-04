import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location, isPlatformBrowser } from '@angular/common';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';

declare var bootstrap: any;

@Injectable({ providedIn: 'root' })
export class BackNavigationService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private currentUrl = '';

  // Routes that are dashboards — back button should NOT trigger on these
  private readonly dashboardRoutes = ['/farmer', '/buyer', '/control', '/apu', '/homepage'];

  constructor(
    private readonly router: Router,
    private readonly location: Location,
    private readonly authService: AuthService,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {
    this.init();
  }

  private init(): void {
    // Track current URL
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe((e: any) => { this.currentUrl = e.urlAfterRedirects; });

    // Intercept browser back button
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('popstate', this.onPopState);
    }
  }

  private onPopState = (): void => {
    if (!this.authService.isAuthenticated()) return;

    // Push state forward again to prevent actual back navigation
    this.location.go(this.currentUrl);

    // Show confirmation modal
    const modalEl = document.getElementById('backNavModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.show();
    }
  };

  confirmNavigation(): void {
    const modalEl = document.getElementById('backNavModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
    const dashboardRoute = this.authService.getDashboardRoute();
    this.router.navigate([dashboardRoute]);
  }

  cancelNavigation(): void {
    const modalEl = document.getElementById('backNavModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('popstate', this.onPopState);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
