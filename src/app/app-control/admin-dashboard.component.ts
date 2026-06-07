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
  imports: [CommonModule],
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
    console.log('Loading dashboard data...');
    
    // Load all users (farmers and sellers)
    this.firebaseService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: any) => {
        console.log('Users response:', users);
        if (users) {
          const userList = Object.values(users).flat();
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
            if (farmer.typicalCrops) {
              const crops = farmer.typicalCrops.split(',');
              crops.forEach((crop: string) => {
                const cropName = crop.trim();
                const quantity = farmer.acreOfLand ? farmer.acreOfLand * 1000 : 1000;
                totalCrops += quantity;
                
                if (cropMap.has(cropName)) {
                  cropMap.set(cropName, cropMap.get(cropName) + quantity);
                } else {
                  cropMap.set(cropName, quantity);
                }
              });
            }
          });
          
          this.cropsAvailable = Array.from(cropMap.entries()).map(([name, quantity]) => ({
            name,
            quantity
          }));
          
          this.stats.cropsAvailable = totalCrops;
          this.stats.urgentCrops = Math.floor(totalCrops * 0.18);
          
          console.log('Stats updated:', this.stats);
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
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
    
    console.log('Dashboard data loaded');
  }

  setActiveView(view: 'dashboard' | 'farmers' | 'buyers' | 'sellers' | 'service-requests' | 'soil-tests' | 'reports') {
    console.log('Setting active view to:', view);
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
    console.log('Loading farmers data...');
    this.loading = true;
    this.firebaseService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: any) => {
        console.log('Farmers data received:', users);
        if (users) {
          const userList = Object.values(users).flat();
          this.farmersData = userList.filter((user: any) => user.role === 'farmer').map((farmer: any) => ({
            ...farmer,
            totalLand: farmer.acreOfLand || 0,
            cropsProduced: farmer.typicalCrops || 'N/A',
            waterSource: farmer.waterSource || 'N/A',
            soilType: farmer.soilType || 'N/A',
            fertilizers: farmer.fertilizers || 'N/A'
          }));
          console.log('Processed farmers data:', this.farmersData);
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
    console.log('Loading buyers data...');
    this.loading = true;
    
    this.firebaseService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: any) => {
        if (users) {
          const userList = Object.values(users).flat();
          this.buyersData = userList
            .filter((user: any) => user.role === 'buyer')
            .map((buyer: any) => ({
              ...buyer,
              name: buyer.name || 'N/A',
              mobileNo: buyer.mobileNo || buyer.phone || 'N/A',
              email: buyer.email || 'N/A',
              companyName: buyer.companyName || buyer.name || 'N/A',
              village: buyer.village || 'N/A',
              typicalCrops: Array.isArray(buyer.typicalCrops)
                ? buyer.typicalCrops.join(', ')
                : (buyer.typicalCrops || 'N/A')
            }));
        }
        
        console.log('Processed buyers data:', this.buyersData);
        this.currentPage = 1;
        this.updatePagination();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading buyers:', error);
        this.loading = false;
      }
    });
  }

  loadSellersData() {
    console.log('Loading sellers data...');
    this.loading = true;

    this.firebaseService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: any) => {
        if (users) {
          const userList = Object.values(users).flat();
          this.sellersData = userList
            .filter((user: any) => user.role === 'seller')
            .map((seller: any) => ({
              ...seller,
              name: seller.name || 'N/A',
              mobileNo: seller.mobileNo || seller.phone || 'N/A',
              email: seller.email || 'N/A',
              village: seller.village || 'N/A',
              mandal: seller.mandal || 'N/A',
              typicalCrops: Array.isArray(seller.typicalCrops)
                ? seller.typicalCrops.join(', ')
                : (seller.typicalCrops || 'N/A'),
              acreOfLand: seller.acreOfLand || 'N/A'
            }));
        }

        console.log('Processed sellers data:', this.sellersData);
        this.currentPage = 1;
        this.updatePagination();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading sellers:', error);
        this.loading = false;
      }
    });
  }

  loadServiceRequests() {
    console.log('Loading service requests...');
    this.loading = true;
    
    this.firebaseService.getAllServiceRequests().pipe(takeUntil(this.destroy$)).subscribe({
      next: (requests: any) => {
        console.log('Service requests received:', requests);
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
        console.log('Processed service requests:', this.serviceRequests);
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
    console.log('Loading soil test requests...');
    this.loading = true;
    
    this.firebaseService.getAllSoilTestRequests().pipe(takeUntil(this.destroy$)).subscribe({
      next: (requests: any) => {
        console.log('Soil test requests received:', requests);
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
        console.log('Processed soil test requests:', this.soilTestRequests);
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
    console.log(`Updating ${type} request ${requestId} to status: ${status}`);
    
    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (type === 'service') {
      this.firebaseService.updateServiceRequest(requestId, updateData).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          alert('Request status updated successfully!');
          this.loadServiceRequests();
        },
        error: (error) => {
          console.error('Error updating request:', error);
          alert('Failed to update request status');
        }
      });
    } else {
      this.firebaseService.updateSoilTestRequest(requestId, updateData).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          alert('Soil test request status updated successfully!');
          this.loadSoilTestRequests();
        },
        error: (error) => {
          console.error('Error updating soil test request:', error);
          alert('Failed to update soil test request status');
        }
      });
    }
  }

  navigateToFarmers() {
    console.log('Switching to farmers view');
    this.setActiveView('farmers');
  }

  navigateToBuyers() {
    console.log('Switching to buyers view');
    this.setActiveView('buyers');
  }

  navigateToSellers() {
    console.log('Switching to sellers view');
    this.setActiveView('sellers');
  }

  navigateToReports() {
    console.log('Switching to reports view');
    this.setActiveView('reports');
  }

  goBackToControl() {
    this.backToControl.emit();
  }

  matchBuyerSeller() {
    console.log('Matching buyers and sellers...');
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