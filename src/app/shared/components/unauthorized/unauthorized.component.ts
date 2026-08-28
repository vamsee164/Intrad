import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-card">
        <div class="icon-bubble">
          <i class="fas fa-shield-alt"></i>
        </div>
        <span class="error-badge">Access Restricted</span>
        <h1 class="card-title">Authorization Required</h1>
        <p class="card-desc">You do not have the required permissions to view this portal. Please return to your account dashboard or contact platform support.</p>
        
        <div class="actions-group">
          <button class="btn btn-home" (click)="goToDashboard()">
            <i class="fas fa-home me-2"></i>Return Home
          </button>
          <button class="btn btn-logout-outline" (click)="logout()">
            <i class="fas fa-sign-out-alt me-2"></i>Sign Out
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f2a07 0%, #1b4010 50%, #2d5016 100%);
      padding: 24px;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .unauthorized-card {
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(12px);
      padding: 48px 36px;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      text-align: center;
      max-width: 480px;
      width: 100%;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .icon-bubble {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #fee2e2;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      margin: 0 auto 20px auto;
      box-shadow: 0 8px 16px rgba(220, 38, 38, 0.15);
    }
    .error-badge {
      display: inline-block;
      background: #fef2f2;
      color: #b91c1c;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    .card-title {
      color: #0f172a;
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 12px 0;
    }
    .card-desc {
      color: #64748b;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .actions-group {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 0.2s ease;
      border: 1.5px solid transparent;
    }
    .btn-home {
      background: #2d5016;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(45, 80, 22, 0.25);
    }
    .btn-home:hover {
      background: #1b4010;
      transform: translateY(-1px);
    }
    .btn-logout-outline {
      background: transparent;
      border-color: #cbd5e1;
      color: #475569;
    }
    .btn-logout-outline:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private readonly router: Router, private readonly authService: AuthService) {}

  goToDashboard() {
    this.router.navigate(['/homepage']);
  }

  logout() {
    this.authService.logout('/homepage');
  }
}
