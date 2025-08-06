import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuyerComponent } from '../APU/buyer/buyer.component';
import { SellerComponent } from '../APU/seller/seller.component';

@Component({
  selector: 'app-apu-dashboard',
  standalone: true,
  imports: [CommonModule, BuyerComponent, SellerComponent],
  template: `
    <div class="apu-dashboard">
      <div class="header">
        <button (click)="goBack()" class="back-btn">← Back to Control</button>
        <h2>APU System</h2>
      </div>
      
      <div class="nav-tabs">
        <button 
          (click)="activeTab = 'buyer'" 
          [class.active]="activeTab === 'buyer'"
          class="tab-btn">
          Buyer
        </button>
        <button 
          (click)="activeTab = 'seller'" 
          [class.active]="activeTab === 'seller'"
          class="tab-btn">
          Seller
        </button>
      </div>
      
      <div class="tab-content">
        <app-buyer *ngIf="activeTab === 'buyer'"></app-buyer>
        <app-seller *ngIf="activeTab === 'seller'"></app-seller>
      </div>
    </div>
  `,
  styles: [`
    .header { display: flex; align-items: center; margin-bottom: 20px; }
    .back-btn { background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 20px; }
    .nav-tabs { display: flex; margin-bottom: 20px; }
    .tab-btn { 
      padding: 10px 20px; 
      border: 1px solid #ccc; 
      background: #f8f9fa; 
      cursor: pointer; 
      margin-right: 5px; 
    }
    .tab-btn.active { background: #007bff; color: white; }
  `]
})
export class ApuDashboardComponent {
  activeTab = 'buyer';
  @Output() backToControl = new EventEmitter<void>();

  goBack() {
    this.backToControl.emit();
  }
}