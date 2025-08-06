import { Component } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../services/auth.service';

declare var bootstrap: any;

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  constructor(private router: Router, private activatedRoute: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    // Optional: Subscribe to router events to perform actions on navigation changes
    // This isn't strictly necessary for routerLinkActive but useful for debugging or complex logic.
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // console.log('Navigation ended:', this.router.url);
      });
  }

  /**
   * Checks if the current route URL starts with any of the provided prefixes.
   * This is used to highlight parent dropdowns when a child route is active.
   * @param prefixes A string or an array of strings representing URL prefixes.
   * @returns true if the current URL matches any of the prefixes, false otherwise.
   */
  isDropdownActive(prefix: string | string[]): boolean {
    const currentUrl = this.router.url;
    if (Array.isArray(prefix)) {
      return prefix.some((p) => currentUrl.startsWith(p));
    }
    return currentUrl.startsWith(prefix);
  }

  onHomeClick(event: Event): void {
    event.preventDefault();
    
    if (this.authService.isAuthenticated()) {
      // Show confirmation modal if user is logged in
      const modal = document.getElementById('homeConfirmModal');
      if (modal) {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
      }
    } else {
      // Navigate directly if not logged in
      this.router.navigate(['/homepage']);
    }
  }

  confirmHome(): void {
    // Close modal
    const modal = document.getElementById('homeConfirmModal');
    if (modal) {
      const bootstrapModal = bootstrap.Modal.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
    }
    
    // Logout and navigate to homepage
    this.authService.logout();
    this.router.navigate(['/homepage']);
  }
}
