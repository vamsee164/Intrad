import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="report-wrapper p-3 p-md-4">
      <div class="report-header mb-4">
        <div>
          <h1 class="report-title">
            <i class="bi bi-bar-chart-line-fill text-success me-2"></i>Ecosystem Intelligence & Reports
          </h1>
          <p class="report-subtitle mb-0">System-wide agricultural production, buyer demands, and fulfillment analytics</p>
        </div>
        <div class="header-btns">
          <button class="btn btn-outline-secondary me-2" (click)="printReport()">
            <i class="bi bi-printer-fill me-1"></i>Print Report
          </button>
          <button class="btn btn-primary" (click)="goBack()">
            <i class="bi bi-arrow-left me-1"></i>Back to Control Center
          </button>
        </div>
      </div>

      <!-- KPI Ribbon -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="kpi-card border-green">
            <span class="kpi-label">Total Farmers</span>
            <h2 class="kpi-val text-success">{{ totalFarmers }}</h2>
            <span class="kpi-sub">{{ totalLandArea | number }} Acres Land</span>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card border-blue">
            <span class="kpi-label">Buyer Inquiries</span>
            <h2 class="kpi-val text-primary">{{ totalBuyers }}</h2>
            <span class="kpi-sub">Bulk Procurement</span>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card border-orange">
            <span class="kpi-label">Seller Offers</span>
            <h2 class="kpi-val text-warning">{{ totalSellers }}</h2>
            <span class="kpi-sub">Active Crop Batches</span>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card border-purple">
            <span class="kpi-label">Service Requests</span>
            <h2 class="kpi-val text-purple">{{ totalServices }}</h2>
            <span class="kpi-sub">{{ completedServices }} Completed</span>
          </div>
        </div>
      </div>

      <!-- Main Tables & Breakdowns -->
      <div class="row g-4 mb-4">
        <div class="col-12 col-lg-7">
          <div class="report-card h-100">
            <div class="report-card-header">
              <h5 class="mb-0"><i class="bi bi-flower2 text-success me-2"></i>Crop Yield Estimates</h5>
              <span class="badge bg-success-subtle text-success">{{ cropSummary.length }} Varieties</span>
            </div>
            <div class="report-card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Crop Name</th>
                      <th>Registered Farmers</th>
                      <th class="text-end">Est. Volume (Kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let crop of cropSummary">
                      <td class="fw-semibold">{{ crop.name }}</td>
                      <td><span class="badge bg-light text-dark border">{{ crop.farmerCount }} producers</span></td>
                      <td class="text-end fw-bold text-success">{{ crop.quantity | number }} Kg</td>
                    </tr>
                    <tr *ngIf="cropSummary.length === 0">
                      <td colspan="3" class="text-center py-4 text-muted">No crop listings recorded.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-5">
          <div class="report-card h-100">
            <div class="report-card-header">
              <h5 class="mb-0"><i class="bi bi-pie-chart-fill text-primary me-2"></i>Operational Summary</h5>
            </div>
            <div class="report-card-body">
              <div class="stat-summary-row mb-3">
                <div class="d-flex justify-content-between mb-1">
                  <span>Service Request Approval Rate</span>
                  <strong>{{ serviceApprovalRate }}%</strong>
                </div>
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar bg-success" [style.width.%]="serviceApprovalRate"></div>
                </div>
              </div>

              <div class="stat-summary-row mb-3">
                <div class="d-flex justify-content-between mb-1">
                  <span>Soil Testing Completion Rate</span>
                  <strong>{{ soilTestCompletionRate }}%</strong>
                </div>
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar bg-primary" [style.width.%]="soilTestCompletionRate"></div>
                </div>
              </div>

              <div class="stat-summary-row">
                <div class="d-flex justify-content-between mb-1">
                  <span>Commercial Sourcing Activity</span>
                  <strong>{{ totalBuyers + totalSellers }} Active Transactors</strong>
                </div>
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar bg-warning" style="width: 85%;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-wrapper {
      min-height: 100vh;
      background-color: #f8fafc;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .report-header {
      background: #ffffff;
      padding: 20px 24px;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .report-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .report-subtitle {
      font-size: 0.85rem;
      color: #64748b;
    }
    .kpi-card {
      background: #ffffff;
      padding: 18px 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .border-green { border-left: 4px solid #16a34a; }
    .border-blue { border-left: 4px solid #0284c7; }
    .border-orange { border-left: 4px solid #f59e0b; }
    .border-purple { border-left: 4px solid #7c3aed; }
    .kpi-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-val {
      font-size: 1.6rem;
      font-weight: 800;
      margin: 4px 0;
    }
    .kpi-sub {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .report-card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      overflow: hidden;
    }
    .report-card-header {
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .report-card-body {
      padding: 20px;
    }
    .table th {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      padding: 12px 16px;
    }
    .table td {
      padding: 12px 16px;
      font-size: 0.88rem;
    }
    @media print {
      .header-btns { display: none !important; }
      .report-wrapper { background: #ffffff !important; padding: 0 !important; }
    }
  `]
})
export class ReportComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  totalFarmers = 0;
  totalBuyers = 0;
  totalSellers = 0;
  totalServices = 0;
  completedServices = 0;
  totalLandArea = 0;
  serviceApprovalRate = 0;
  soilTestCompletionRate = 0;
  cropSummary: { name: string; quantity: number; farmerCount: number }[] = [];

  constructor(
    private readonly router: Router,
    private readonly firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.loadReportData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReportData(): void {
    this.firebaseService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: any) => {
        if (users) {
          const userList = Object.values(users) as any[];
          const farmers = userList.filter((u: any) => u.role === 'farmer');
          this.totalFarmers = farmers.length;

          let landTotal = 0;
          const cropMap = new Map<string, { quantity: number; farmerCount: number }>();

          farmers.forEach((f) => {
            if (f.acreOfLand) landTotal += parseFloat(f.acreOfLand) || 0;
            const crops = Array.isArray(f.typicalCrops) ? f.typicalCrops : String(f.typicalCrops || '').split(',');
            crops.forEach((c: string) => {
              const name = c.trim();
              if (!name) return;
              const qty = f.acreOfLand ? parseFloat(f.acreOfLand) * 1000 : 1000;
              const existing = cropMap.get(name) || { quantity: 0, farmerCount: 0 };
              cropMap.set(name, {
                quantity: existing.quantity + qty,
                farmerCount: existing.farmerCount + 1
              });
            });
          });

          this.totalLandArea = landTotal;
          this.cropSummary = Array.from(cropMap.entries()).map(([name, data]) => ({
            name,
            quantity: data.quantity,
            farmerCount: data.farmerCount
          }));
        }
      }
    });

    this.firebaseService.getAllBuyerForms().pipe(takeUntil(this.destroy$)).subscribe({
      next: (buyers: any) => {
        if (buyers) this.totalBuyers = Object.keys(buyers).length;
      }
    });

    this.firebaseService.getAllSellerForms().pipe(takeUntil(this.destroy$)).subscribe({
      next: (sellers: any) => {
        if (sellers) this.totalSellers = Object.keys(sellers).length;
      }
    });

    this.firebaseService.getAllServiceRequests().pipe(takeUntil(this.destroy$)).subscribe({
      next: (services: any) => {
        if (services) {
          const list = Object.values(services) as any[];
          this.totalServices = list.length;
          const approved = list.filter((s) => s.status === 'approved' || s.status === 'completed').length;
          this.completedServices = list.filter((s) => s.status === 'completed').length;
          this.serviceApprovalRate = this.totalServices > 0 ? Math.round((approved / this.totalServices) * 100) : 0;
        }
      }
    });

    this.firebaseService.getAllSoilTestRequests().pipe(takeUntil(this.destroy$)).subscribe({
      next: (tests: any) => {
        if (tests) {
          const list = Object.values(tests) as any[];
          const total = list.length;
          const completed = list.filter((t) => t.status === 'COMPLETED' || t.status === 'approved').length;
          this.soilTestCompletionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        }
      }
    });
  }

  printReport(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/control']);
  }
}