import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface DashboardStats {
  totalFarmers: number;
  totalBuyers: number;
  cropsAvailable: number;
  urgentCrops: number;
  activeBuyers: number;
}

interface CropData {
  name: string;
  quantity: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  providers: [DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Output() backToControl = new EventEmitter<void>();
  activeView: 'dashboard' | 'farmers' | 'buyers' | 'sellers' | 'service-requests' | 'soil-tests' | 'reports' = 'dashboard';
  stats: DashboardStats = {
    totalFarmers: 0,
    totalBuyers: 0,
    cropsAvailable: 0,
    urgentCrops: 0,
    activeBuyers: 0
  };

  cropsAvailable: CropData[] = [];
  urgentCrops: any[] = [];
  buyerDemands: any[] = [];
  farmersData: any[] = [];
  buyersData: any[] = [];
  sellersData: any[] = [];
  serviceRequests: any[] = [];
  soilTestRequests: any[] = [];
  loading = true;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  paginatedServiceRequests: any[] = [];
  paginatedSoilTests: any[] = [];
  paginatedFarmers: any[] = [];
  paginatedBuyers: any[] = [];
  paginatedSellers: any[] = [];

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.loading = true;
    
    // Load all users (farmers and sellers)
    this.firebaseService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: any) => {
        if (users) {
          const userList = Object.values(users) as any[];
          const farmers = userList.filter((user: any) => user.role === 'farmer');
          const sellers = userList.filter((user: any) => user.role === 'seller' || user.role === 'user');
          
          this.stats.totalFarmers = farmers.length;
          this.stats.totalBuyers = sellers.length;
          this.stats.activeBuyers = sellers.length;
          
          // Calculate crops available from farmers data
          let totalCrops = 0;
          this.cropsAvailable = [];
          const cropMap = new Map();
          
          farmers.forEach((farmer: any) => {
            const rawCrops = farmer.typicalCrops;
            if (rawCrops) {
              const crops = Array.isArray(rawCrops)
                ? rawCrops
                : String(rawCrops).split(',');
              crops.forEach((crop: string) => {
                const cropName = crop.trim();
                if (!cropName) return;
                const quantity = farmer.acreOfLand ? parseFloat(farmer.acreOfLand) * 1000 : 1000;
                totalCrops += quantity;
                cropMap.set(cropName, (cropMap.get(cropName) || 0) + quantity);
              });
            }
          });
          
          this.cropsAvailable = Array.from(cropMap.entries()).map(([name, quantity]) => ({
            name,
            quantity
          }));
          
          this.stats.cropsAvailable = totalCrops;
          this.stats.urgentCrops = Math.floor(totalCrops * 0.18);
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.stats.totalFarmers = 0;
        this.stats.totalBuyers = 0;
        this.stats.activeBuyers = 0;
        this.loading = false;
      }
    });

    // Set fallback data for buyer demands and urgent crops
    this.buyerDemands = [
      { name: 'FreshMart', bid: '₹3,000', ttl: '3 days' },
      { name: 'AgriCorp', bid: '₹1,500', ttl: 'Tomorrow' },
      { name: 'GreenMarket', bid: '₹2,500', ttl: '5 days' }
    ];

    this.urgentCrops = [
      { name: 'Chilli', quantity: 1800, timeframe: '24 hrs' },
      { name: 'Onion', quantity: 4500, timeframe: '48 hrs' },
      { name: 'Tomato', quantity: 2200, timeframe: '72 hrs' }
    ];
    
  }

  setActiveView(view: 'dashboard' | 'farmers' | 'buyers' | 'sellers' | 'service-requests' | 'soil-tests' | 'reports') {
    this.activeView = view;
    
    if (view === 'farmers') {
      this.loadFarmersData();
    } else if (view === 'buyers') {
      this.loadBuyersData();
    } else if (view === 'sellers') {
      this.loadSellersData();
    } else if (view === 'service-requests') {
      this.loadServiceRequests();
    } else if (view === 'soil-tests') {
      this.loadSoilTestRequests();
    } else if (view === 'dashboard') {
      this.loadDashboardData();
    }
  }

  loadFarmersData() {
    this.loading = true;
    this.firebaseService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: any) => {
        if (users) {
          const userList = Object.values(users) as any[];
          this.farmersData = userList.filter((user: any) => user.role === 'farmer').map((farmer: any) => ({
            ...farmer,
            totalLand: farmer.acreOfLand || 0,
            cropsProduced: Array.isArray(farmer.typicalCrops)
              ? farmer.typicalCrops.join(', ')
              : (farmer.typicalCrops || 'N/A'),
            waterSource: farmer.waterSource || 'N/A',
            soilType: farmer.soilType || 'N/A',
            fertilizers: farmer.fertilizers || 'N/A'
          }));
        }
        this.currentPage = 1;
        this.updatePagination();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading farmers:', error);
        this.loading = false;
      }
    });
  }

  loadBuyersData() {
    this.loading = true;

    // Read from buyerForms collection — personal email & phone from the APU buyer form submission
    this.firebaseService.getAllBuyerForms().pipe(takeUntil(this.destroy$)).subscribe({
      next: (forms: any) => {
        if (forms) {
          this.buyersData = Object.entries(forms).map(([key, value]: [string, any]) => ({
            id: key,
            name: value.buyer?.name || 'N/A',
            // Personal email submitted in buyer form — NOT the auto-generated @intra-d.com email
            email: value.buyer?.email || 'N/A',
            // Personal phone submitted in buyer form
            mobileNo: value.buyer?.phone || 'N/A',
            mainCategory: value.mainCategory || 'N/A',
            subCategory: value.subCategory || 'N/A',
            productType: value.productType || 'N/A',
            details: value.details || 'N/A',
            quantity: value.buyer?.quantity || 'N/A',
            status: value.status || 'pending',
            submittedAt: value.submittedAt || value.timestamp || null,
            cropRequired: value.productType || value.mainCategory || 'N/A',
            companyName: value.buyer?.name || 'N/A',
            village: 'N/A',
            createdAt: value.submittedAt || value.timestamp || null
          }));
        } else {
          this.buyersData = [];
        }
        this.currentPage = 1;
        this.updatePagination();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading buyer forms:', error);
        this.buyersData = [];
        this.loading = false;
      }
    });
  }

  loadSellersData() {
    this.loading = true;

    // Read from sellerForms collection — personal email & phone from the APU seller form submission
    this.firebaseService.getAllSellerForms().pipe(takeUntil(this.destroy$)).subscribe({
      next: (forms: any) => {
        if (forms) {
          this.sellersData = Object.entries(forms).map(([key, value]: [string, any]) => ({
            id: key,
            name: value.sellerName || 'N/A',
            // Personal email submitted in seller form — NOT the auto-generated @intra-d.com email
            email: value.email || 'N/A',
            // Personal mobile submitted in seller form
            mobileNo: value.contactNo || 'N/A',
            rawMaterialType: value.rawMaterialType || 'N/A',
            typicalCrops: value.rawMaterialType || 'N/A',
            quantity: value.quantity || 'N/A',
            location: value.location || 'N/A',
            village: value.location || 'N/A',
            mandal: 'N/A',
            pricePerUnit: value.pricePerUnit || 'N/A',
            harvestDate: value.harvestDate || 'N/A',
            qualityGrade: value.qualityGrade || 'N/A',
            status: value.status || 'pending',
            acreOfLand: 'N/A',
            createdAt: value.submittedAt || value.timestamp || null
          }));
        } else {
          this.sellersData = [];
        }
        this.currentPage = 1;
        this.updatePagination();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading seller forms:', error);
        this.sellersData = [];
        this.loading = false;
      }
    });
  }

  loadServiceRequests() {
    this.loading = true;
    
    this.firebaseService.getAllServiceRequests().pipe(takeUntil(this.destroy$)).subscribe({
      next: (requests: any) => {
        if (requests) {
          this.serviceRequests = Object.entries(requests).map(([key, value]: [string, any]) => ({
            id: key,
            ...value
          }));
        } else {
          this.serviceRequests = [];
        }
        this.currentPage = 1;
        this.updatePagination();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading service requests:', error);
        this.serviceRequests = [];
        this.loading = false;
      }
    });
  }

  loadSoilTestRequests() {
    this.loading = true;
    
    this.firebaseService.getAllSoilTestRequests().pipe(takeUntil(this.destroy$)).subscribe({
      next: (requests: any) => {
        if (requests) {
          this.soilTestRequests = Object.entries(requests).map(([key, value]: [string, any]) => ({
            id: key,
            ...value
          }));
        } else {
          this.soilTestRequests = [];
        }
        this.currentPage = 1;
        this.updatePagination();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading soil test requests:', error);
        this.soilTestRequests = [];
        this.loading = false;
      }
    });
  }

  updateRequestStatus(requestId: string, status: string, type: 'service' | 'soil') {
    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (type === 'service') {
      this.firebaseService.updateServiceRequest(requestId, updateData).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.loadServiceRequests(); },
        error: () => { /* silent — handled by Firestore */ }
      });
    } else {
      this.firebaseService.updateSoilTestRequest(requestId, updateData).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.loadSoilTestRequests(); },
        error: () => { /* silent — handled by Firestore */ }
      });
    }
  }

  navigateToFarmers() { this.setActiveView('farmers'); }
  navigateToBuyers() { this.setActiveView('buyers'); }
  navigateToSellers() { this.setActiveView('sellers'); }
  navigateToReports() { this.setActiveView('reports'); }

  goBackToControl() {
    this.backToControl.emit();
  }

  matchBuyerSeller() {
    // TODO: Implement buyer-seller matching logic
  }

  private updatePagination() {
    const sourceMap: Record<string, any[]> = {
      'service-requests': this.serviceRequests,
      'soil-tests': this.soilTestRequests,
      'farmers': this.farmersData,
      'buyers': this.buyersData,
      'sellers': this.sellersData
    };
    const source = sourceMap[this.activeView] || [];
    this.totalItems = source.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const sliced = source.slice(start, end);
    if (this.activeView === 'service-requests') this.paginatedServiceRequests = sliced;
    else if (this.activeView === 'soil-tests') this.paginatedSoilTests = sliced;
    else if (this.activeView === 'farmers') this.paginatedFarmers = sliced;
    else if (this.activeView === 'buyers') this.paginatedBuyers = sliced;
    else if (this.activeView === 'sellers') this.paginatedSellers = sliced;
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  trackByFn(index: number, item: any): any {
    return item?.id || item?.userId || item?.requestId || item?.name || index;
  }

  trackByIndex(index: number): number {
    return index;
  }
}