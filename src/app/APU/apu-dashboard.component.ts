import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-apu-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="apu-dashboard-container">

      <!-- ── Top Header Bar (replaces global navbar on this route) ── -->
      <div class="apu-header">
        <div class="apu-header-inner">
          <!-- Brand / Page title -->
          <div class="apu-brand">
            <div class="apu-brand-icon">🏭</div>
            <div>
              <div class="apu-brand-name">APU Portal</div>
              <div class="apu-brand-sub">Agricultural Processing Unit</div>
            </div>
          </div>

          <!-- Right-side actions -->
          <div class="apu-header-actions">
            <button class="btn btn-apu-control me-2"
                    (click)="backToControl()" *ngIf="isAdmin()"
                    title="Back to Admin Control">
              <i class="bi bi-speedometer2 me-1"></i>
              <span class="d-none d-sm-inline">Control Panel</span>
            </button>

            <!-- Profile pill -->
            <button class="btn btn-apu-profile" (click)="goToProfile()" title="View Profile">
              <i class="bi bi-person-circle me-2"></i>
              <span class="d-none d-sm-inline">{{ currentUser?.name || 'Profile' }}</span>
            </button>

            <!-- Logout pill -->
            <button class="btn btn-apu-logout" (click)="logout()" title="Logout">
              <i class="bi bi-box-arrow-right me-1"></i>
              <span class="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── Welcome Section ── -->
      <div class="apu-welcome">
        <h1 class="apu-welcome-title">
          Welcome{{ currentUser?.name ? ', ' + currentUser!.name : '' }}! 👋
        </h1>
        <p class="apu-welcome-sub">Choose a portal to continue</p>
      </div>

      <!-- ── Service Cards ── -->
      <div class="apu-cards-grid">
        <!-- Buyer Card -->
        <div class="service-card buyer-card" (click)="navigateToBuyer()">
          <div class="service-icon">🛒</div>
          <h2>Buyer Portal</h2>
          <p>Looking to purchase agricultural products? Submit your requirements and connect with sellers.</p>
          <button class="btn btn-buyer w-100">
            <i class="bi bi-cart-check me-2"></i>Go to Buyer Form
          </button>
        </div>

        <!-- Seller Card -->
        <div class="service-card seller-card" (click)="navigateToSeller()">
          <div class="service-icon">📦</div>
          <h2>Seller Portal</h2>
          <p>Have agricultural products to sell? List your offerings and reach potential buyers.</p>
          <button class="btn btn-seller w-100">
            <i class="bi bi-box-seam me-2"></i>Go to Seller Form
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Container ─────────────────────────── */
    .apu-dashboard-container {
      min-height: 100vh;
      background:
        radial-gradient(ellipse 80% 50% at 0% 0%, rgba(45,80,22,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 100% 100%, rgba(200,148,26,0.05) 0%, transparent 60%),
        linear-gradient(160deg, #f8fdf8 0%, #fefdf8 50%, #f8fbf8 100%);
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
    }

    /* ── Top Header ────────────────────────── */
    .apu-header {
      background: linear-gradient(135deg, #0f2a07 0%, #2d5016 55%, #4a7c59 100%);
      box-shadow: 0 4px 24px rgba(45,80,22,0.28);
      padding: 0 24px;
    }

    .apu-header-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 68px;
      gap: 12px;
    }

    .apu-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .apu-brand-icon {
      font-size: 28px;
      line-height: 1;
    }

    .apu-brand-name {
      font-size: 17px;
      font-weight: 800;
      color: #fff;
      line-height: 1.2;
    }

    .apu-brand-sub {
      font-size: 11px;
      color: rgba(255,255,255,0.65);
      font-weight: 500;
    }

    .apu-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    /* Control Panel pill */
    .btn-apu-control {
      display: inline-flex;
      align-items: center;
      background: rgba(255,255,255,0.18);
      border: 1.5px solid rgba(255,255,255,0.35);
      color: #fff;
      border-radius: 100px;
      padding: 7px 16px;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.18s ease, transform 0.15s ease;
      white-space: nowrap;
    }

    .btn-apu-control:hover {
      background: rgba(255,255,255,0.30);
      color: #fff;
      transform: translateY(-1px);
    }

    /* Profile pill */
    .btn-apu-profile {
      display: inline-flex;
      align-items: center;
      background: rgba(255,255,255,0.18);
      border: 1.5px solid rgba(255,255,255,0.35);
      color: #fff;
      border-radius: 100px;
      padding: 7px 16px;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.18s ease, transform 0.15s ease;
      white-space: nowrap;
    }

    .btn-apu-profile:hover {
      background: rgba(255,255,255,0.30);
      color: #fff;
      transform: translateY(-1px);
    }

    /* Logout pill */
    .btn-apu-logout {
      display: inline-flex;
      align-items: center;
      background: rgba(220, 53, 69, 0.22);
      border: 1.5px solid rgba(220, 53, 69, 0.45);
      color: #fff;
      border-radius: 100px;
      padding: 7px 16px;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.18s ease, transform 0.15s ease;
      white-space: nowrap;
    }

    .btn-apu-logout:hover {
      background: rgba(220, 53, 69, 0.45);
      color: #fff;
      transform: translateY(-1px);
    }

    /* ── Welcome ────────────────────────────── */
    .apu-welcome {
      text-align: center;
      padding: 48px 24px 32px;
      max-width: 640px;
      margin: 0 auto;
    }

    .apu-welcome-title {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 800;
      color: #1b4010;
      margin-bottom: 8px;
      letter-spacing: -0.3px;
    }

    .apu-welcome-sub {
      color: #6b7280;
      font-size: 16px;
      margin: 0;
    }

    /* ── Cards Grid ─────────────────────────── */
    .apu-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      max-width: 900px;
      margin: 0 auto;
      padding: 0 24px 48px;
    }

    .service-card {
      background: #fff;
      border-radius: 20px;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(45,80,22,0.10), 0 2px 8px rgba(0,0,0,0.06);
      border: 1.5px solid rgba(45,80,22,0.08);
      transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
      cursor: pointer;
    }

    .service-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 16px 48px rgba(45,80,22,0.16), 0 6px 16px rgba(0,0,0,0.08);
    }

    .buyer-card:hover  { border-color: #2e6fbd; }
    .seller-card:hover { border-color: #2d5016; }

    .service-icon {
      font-size: 4.5rem;
      margin-bottom: 20px;
      display: block;
    }

    .service-card h2 {
      color: #1b4010;
      font-weight: 800;
      font-size: 22px;
      margin-bottom: 12px;
    }

    .service-card p {
      color: #6b7280;
      margin-bottom: 28px;
      font-size: 15px;
      line-height: 1.65;
    }

    /* Buyer button */
    .btn-buyer {
      background: linear-gradient(135deg, #1e4e8c 0%, #2e6fbd 100%);
      border: none;
      color: #fff;
      border-radius: 12px;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(30,78,140,0.30);
      transition: all 0.18s ease;
    }

    .btn-buyer:hover {
      background: linear-gradient(135deg, #163a6e 0%, #1e4e8c 100%);
      box-shadow: 0 6px 20px rgba(30,78,140,0.40);
      transform: translateY(-1px);
      color: #fff;
    }

    /* Seller button */
    .btn-seller {
      background: linear-gradient(135deg, #2d5016 0%, #4a7c59 100%);
      border: none;
      color: #fff;
      border-radius: 12px;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(45,80,22,0.30);
      transition: all 0.18s ease;
    }

    .btn-seller:hover {
      background: linear-gradient(135deg, #1b4010 0%, #3d6b1f 100%);
      box-shadow: 0 6px 20px rgba(45,80,22,0.40);
      transform: translateY(-1px);
      color: #fff;
    }

    /* ── Responsive ─────────────────────────── */
    @media (max-width: 600px) {
      .apu-header    { padding: 0 14px; }
      .apu-header-inner { height: 60px; }
      .apu-brand-icon  { font-size: 22px; }
      .apu-brand-name  { font-size: 14px; }
      .apu-brand-sub   { display: none; }
      .apu-welcome     { padding: 28px 16px 20px; }
      .apu-cards-grid  { padding: 0 14px 32px; gap: 16px; grid-template-columns: 1fr; }
      .service-card    { padding: 24px 18px; }
      .service-icon    { font-size: 3.5rem; }
    }
  `]
})
export class ApuDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToBuyer(): void {
    this.router.navigate(['/apu/buyer']);
  }

  navigateToSeller(): void {
    this.router.navigate(['/apu/seller']);
  }

  backToControl(): void {
    this.router.navigate(['/control']);
  }

  logout(): void {
    this.authService.logout('/homepage');
  }
}
