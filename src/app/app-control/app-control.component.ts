import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { HomepageComponent } from '../FPC/Homepage/homepage.component';
import { ApuDashboardComponent } from '../apu-dashboard/apu-dashboard.component';

@Component({
  selector: 'app-control',
  standalone: true,
  imports: [CommonModule, HomepageComponent, ApuDashboardComponent],
  template: `
    <div *ngIf="!currentUser" class="login-prompt">
      <h2>Access Control System</h2>
      <button (click)="goToLogin()" class="login-btn">Login to Continue</button>
    </div>
    
    <div *ngIf="currentUser && !showFPC && !showAPU">
      <div class="control-container">
        <div class="user-info">
          <h2>Welcome, {{currentUser.email}}</h2>
          <p>Role: {{currentUser.role}}</p>
        </div>
        
        <div class="app-controls">
          <button 
            *ngIf="canAccessAPU()" 
            (click)="launchAPU()" 
            class="app-btn apu-btn">
            Launch APU System
          </button>
          
          <button 
            *ngIf="canAccessFPC()" 
            (click)="launchFPC()" 
            class="app-btn fpc-btn">
            Launch FPC System
          </button>
        </div>
        
        <button (click)="logout()" class="logout-btn">Logout</button>
      </div>
    </div>
    
    <div *ngIf="showFPC">
      <app-homepage></app-homepage>
    </div>
    
    <div *ngIf="showAPU">
      <app-apu-dashboard (backToControl)="backToControl()"></app-apu-dashboard>
    </div>
  `,
  styles: [`
    .control-container { padding: 20px; text-align: center; }
    .app-controls { margin: 20px 0; }
    .app-btn { 
      margin: 10px; 
      padding: 15px 30px; 
      font-size: 16px; 
      border: none; 
      border-radius: 5px; 
      cursor: pointer; 
    }
    .apu-btn { background: #007bff; color: white; }
    .fpc-btn { background: #28a745; color: white; }
    .logout-btn { background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; }
    .login-btn { background: #007bff; color: white; padding: 15px 30px; font-size: 16px; border: none; border-radius: 5px; cursor: pointer; }
  `]
})
export class AppControlComponent implements OnInit {
  currentUser: User | null = null;
  showFPC = false;
  showAPU = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  canAccessAPU(): boolean {
    return this.authService.hasRole('admin') || this.authService.hasRole('farmer');
  }

  canAccessFPC(): boolean {
    return this.authService.isAuthenticated();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  launchAPU() {
    this.showAPU = true;
  }

  launchFPC() {
    this.showFPC = true;
  }

  backToControl() {
    this.showAPU = false;
    this.showFPC = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}