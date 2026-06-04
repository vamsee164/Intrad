import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { LanguageSwitcherComponent } from '../shared/language-switcher.component';
import { TranslatePipe } from '../shared/translate.pipe';

declare var bootstrap: any;

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, LanguageSwitcherComponent, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  /** Fix #14: expose as a property updated reactively, NOT called directly in template */
  isAuthenticated = false;
  currentUser: any = null;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Auto-collapse the mobile navbar on every successful navigation
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.collapseNavbar();
      });

    // Fix #14: Subscribe to auth state — update property, don't call fn in template
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAuthenticated = !!user;
        this.currentUser = user;
      });
  }

  goToDashboard(): void {
    if (this.currentUser) {
      const route = this.authService.getDashboardRoute(this.currentUser.role);
      this.router.navigate([route]);
    }
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout('/homepage');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Collapses the Bootstrap mobile navbar if it is currently open. */
  private collapseNavbar(): void {
    try {
      const navbarEl = document.getElementById('homepageNavbar');
      if (navbarEl && navbarEl.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarEl)
          ?? new bootstrap.Collapse(navbarEl, { toggle: false });
        bsCollapse.hide();
      }
    } catch (err) {
      // Bootstrap not yet loaded — ignore
    }
  }

  /**
   * Checks if the current route URL starts with any of the provided prefixes.
   */
  isDropdownActive(prefix: string | string[]): boolean {
    const currentUrl = this.router.url;
    if (Array.isArray(prefix)) {
      return prefix.some((p) => currentUrl.startsWith(p));
    }
    return currentUrl.startsWith(prefix);
  }

  /** Fix #21: Single method for both Home link and Logo click — was duplicated */
  handleHomeNavigation(event: Event): void {
    event.preventDefault();
    if (this.isAuthenticated) {
      const modal = document.getElementById('homeConfirmModal');
      if (modal) {
        try {
          const bootstrapModal = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
          bootstrapModal.show();
        } catch { /* ignore */ }
      }
    } else {
      this.router.navigate(['/homepage']);
    }
  }

  confirmHome(): void {
    const modal = document.getElementById('homeConfirmModal');
    if (modal) {
      try {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) bootstrapModal.hide();
      } catch { /* ignore */ }
    }
    this.authService.logout('/homepage');
  }

  /**
   * Opens the signup modal. If not on the homepage, navigates there first,
   * then opens the modal once the page is ready.
   */
  openSignupModal(event: Event): void {
    event.preventDefault();
    const openModal = () => {
      // Clean up any stale backdrops first
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('padding-right');
      document.body.style.removeProperty('overflow');

      setTimeout(() => {
        try {
          const modalEl = document.getElementById('signupModal');
          if (modalEl) {
            // Always create a fresh instance to avoid stale state
            let bsModal = bootstrap.Modal.getInstance(modalEl);
            if (bsModal) { bsModal.dispose(); }
            bsModal = new bootstrap.Modal(modalEl, { backdrop: true, keyboard: true });
            bsModal.show();
          }
        } catch { /* ignore */ }
      }, 100);
    };

    if (this.router.url.startsWith('/homepage')) {
      openModal();
    } else {
      this.router.navigate(['/homepage']).then(() => {
        setTimeout(openModal, 500);
      });
    }
  }

  isControlPage(): boolean {
    return this.router.url === '/control';
  }
}
