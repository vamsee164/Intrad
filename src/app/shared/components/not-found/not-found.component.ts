import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-card">
        <div class="code-badge">404</div>
        <div class="icon-avatar">🌾</div>
        <h1 class="not-found-title">Page Not Found</h1>
        <p class="not-found-desc">
          The field you are looking for has moved or does not exist. Let's get you back to the fertile grounds of Intra-D.
        </p>
        <div class="actions-row">
          <button class="btn btn-primary-eco" (click)="goHome()">
            <i class="fas fa-home me-2"></i>Go to Homepage
          </button>
          <button class="btn btn-outline-eco" (click)="goBack()">
            <i class="fas fa-arrow-left me-2"></i>Go Back
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f2a07 0%, #1b4010 50%, #2d5016 100%);
      padding: 24px;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .not-found-card {
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
    .code-badge {
      display: inline-block;
      background: #e8f5e8;
      color: #2d5016;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.1em;
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    .icon-avatar {
      font-size: 56px;
      margin-bottom: 12px;
    }
    .not-found-title {
      color: #0f172a;
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 10px 0;
    }
    .not-found-desc {
      color: #64748b;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .actions-row {
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
    .btn-primary-eco {
      background: #2d5016;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(45, 80, 22, 0.25);
    }
    .btn-primary-eco:hover {
      background: #1b4010;
      transform: translateY(-1px);
    }
    .btn-outline-eco {
      background: transparent;
      border-color: #cbd5e1;
      color: #475569;
    }
    .btn-outline-eco:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
  `]
})
export class NotFoundComponent {
  constructor(private readonly router: Router) {}

  goHome() {
    this.router.navigate(['/homepage']);
  }

  goBack() {
    window.history.back();
  }
}
