import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { BackNavigationService } from './guards/back-navigation.service';
import { CommonModule } from '@angular/common';
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
  '/404',
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

  private readonly destroy$ = new Subject<void>();

  constructor(
    public readonly backNav: BackNavigationService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e: any) => {
        const url: string = e.urlAfterRedirects || e.url || '';
        this.isInsideDashboard = DASHBOARD_ROUTES.some(r => url.startsWith(r));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
