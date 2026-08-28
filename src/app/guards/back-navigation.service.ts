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
  private isFormDirty = false;

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
      .subscribe((e: any) => {
        this.currentUrl = e.urlAfterRedirects;
        this.isFormDirty = false; // Reset dirty state on navigation
      });
  }

  setDirty(dirty: boolean): void {
    this.isFormDirty = dirty;
  }

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
    this.destroy$.next();
    this.destroy$.complete();
  }
}
