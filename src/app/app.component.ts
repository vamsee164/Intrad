import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { BackNavigationService } from './guards/back-navigation.service';
import { AuthService } from './services/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter, Subject, takeUntil } from 'rxjs';

/**
 * Routes where the public navbar + footer should be hidden.
 * Dashboard pages have their own in-page headers and profile access.
 */
const DASHBOARD_ROUTES = [
  '/farmer',
  '/apu',
  '/buyer',
  '/control',
  '/report',
  '/profile',
  '/unauthorized',
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'intra-d';

  /** True when the current route is a dashboard/authenticated page */
  isInsideDashboard = false;

  /** Controls display of the Not Found modal */
  showNotFoundModal = false;

  /** True when user is authenticated */
  isAuthenticated = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    public readonly backNav: BackNavigationService,
    private readonly router: Router,
    private readonly authService: AuthService,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAuthenticated = !!user;
      });

    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e: any) => {
        const url: string = e.urlAfterRedirects || e.url || '';
        this.isInsideDashboard = DASHBOARD_ROUTES.some(r => url.startsWith(r));

        // Check if on 404 route to display modal
        if (url === '/404' || url.startsWith('/404')) {
          this.showNotFoundModal = true;
        } else {
          this.showNotFoundModal = false;
        }

        // Multi-phase scroll-to-top to ensure header is always in view on navigation
        this.scrollToTop();
      });
  }

  /**
   * Resets scroll position to top across window, document, body, and main containers
   */
  private scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });

      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTop = 0;
      }, 50);
    }
  }

  closeNotFoundAndNavigate(): void {
    this.showNotFoundModal = false;
    if (this.isAuthenticated) {
      this.router.navigate([this.authService.getDashboardRoute()]);
    } else {
      this.router.navigate(['/homepage']);
    }
  }

  closeNotFoundModal(): void {
    this.showNotFoundModal = false;
    if (isPlatformBrowser(this.platformId) && window.history.length > 1) {
      window.history.back();
    } else {
      this.closeNotFoundAndNavigate();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
