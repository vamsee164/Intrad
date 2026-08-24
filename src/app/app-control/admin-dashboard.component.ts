import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface DashboardStats {
  totalFarmers: number;
  totalBuyers: number;
  cropsAvailable: number;
  urgentCrops: number;
  activeBuyers: number;
  totalSellers: number;
  pendingServices: number;
  pendingSoilTests: number;
}

interface CropData {
  name: string;
  quantity: number;
  farmerCount?: number;
}

interface MatchPair {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  cropRequired: string;
  quantityRequired: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  sellerLocation: string;
  availableQuantity: string;
  pricePerUnit: string;
  matchScore: number;
}

interface AnalyticsBreakdown {
  soilTypes: { type: string; count: number; percentage: number }[];
  waterSources: { source: string; count: number; percentage: number }[];
  landDistribution: { label: string; count: number; percentage: number }[];
  requestStatusBreakdown: { status: string; count: number; percentage: number }[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  providers: [DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @Output() backToControl = new EventEmitter<void>();

  activeView: 'dashboard' | 'farmers' | 'buyers' | 'sellers' | 'service-requests' | 'soil-tests' | 'reports' = 'dashboard';

  stats: DashboardStats = {
    totalFarmers: 0,
    totalBuyers: 0,
    cropsAvailable: 0,
    urgentCrops: 0,
    activeBuyers: 0,
    totalSellers: 0,
    pendingServices: 0,
    pendingSoilTests: 0
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

  // Search & Filter
  searchQuery = '';
  statusFilter = 'all';

  // Matchmaking
  showMatchModal = false;
  matchedPairs: MatchPair[] = [];
  matchSearchCrop = '';

  // Analytics for reports
  analytics: AnalyticsBreakdown = {
    soilTypes: [],
    waterSources: [],
    landDistribution: [],
    requestStatusBreakdown: []
  };

  // Toast notification
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'success';
  private toastTimer: any = null;

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
    private readonly router: Router,
    private readonly firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  loadAllData(): void {
    this.loadDashboardData();
    this.loadFarmersData();
    this.loadBuyersData();
    this.loadSellersData();
    this.loadServiceRequests();
    this.loadSoilTestRequests();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    this.firebaseService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: any) => {
        if (users) {
          const userList = Object.values(users) as any[];
          const farmers = userList.filter((user: any) => user.role === 'farmer');
          const sellers = userList.filter((user: any) => user.role === 'seller' || user.role === 'user');
          
          this.stats.totalFarmers = farmers.length;
          this.stats.totalBuyers = sellers.length;
          this.stats.activeBuyers = sellers.length;
          
          let totalCrops = 0;
          this.cropsAvailable = [];
          const cropMap = new Map<string, { quantity: number; farmerCount: number }>();
          
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

                const existing = cropMap.get(cropName) || { quantity: 0, farmerCount: 0 };
                cropMap.set(cropName, {
                  quantity: existing.quantity + quantity,
                  farmerCount: existing.farmerCount + 1
                });
              });
            }
          });
          
          this.cropsAvailable = Array.from(cropMap.entries()).map(([name, data]) => ({
            name,
            quantity: data.quantity,
            farmerCount: data.farmerCount
          }));
          
          this.stats.cropsAvailable = totalCrops;
          this.stats.urgentCrops = Math.floor(totalCrops * 0.18);

          this.calculateAnalytics(farmers);
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('[AdminDashboard] Error loading users:', error);
        this.loading = false;
      }
    });

    this.buyerDemands = [
      { name: 'FreshMart Organics', crop: 'Tomato', bid: '₹3,200/qtl', ttl: '3 days' },
      { name: 'AgriCorp Processing', crop: 'Chilli', bid: '₹14,500/qtl', ttl: 'Tomorrow' },
      { name: 'GreenMarket Retail', crop: 'Onion', bid: '₹2,600/qtl', ttl: '5 days' },
      { name: 'Apex Agro Exports', crop: 'Cotton', bid: '₹7,800/qtl', ttl: '2 days' }
    ];

    this.urgentCrops = [
      { name: 'Chilli', quantity: 1800, timeframe: '24 hrs' },
      { name: 'Onion', quantity: 4500, timeframe: '48 hrs' },
      { name: 'Tomato', quantity: 2200, timeframe: '72 hrs' }
    ];
  }

  setActiveView(view: 'dashboard' | 'farmers' | 'buyers' | 'sellers' | 'service-requests' | 'soil-tests' | 'reports'): void {
    this.activeView = view;
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.currentPage = 1;
    
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
    } else if (view === 'dashboard' || view === 'reports') {
      this.loadDashboardData();
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  loadFarmersData(): void {
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

  loadBuyersData(): void {
    this.loading = true;

    this.firebaseService.getAllBuyerForms().pipe(takeUntil(this.destroy$)).subscribe({
      next: (forms: any) => {
        if (forms) {
          this.buyersData = Object.entries(forms).map(([key, value]: [string, any]) => ({
            id: key,
            name: value.buyer?.name || 'N/A',
            email: value.buyer?.email || 'N/A',
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
            createdAt: value.submittedAt || value.timestamp || null
          }));
        } else {
          this.buyersData = [];
        }
        this.stats.totalBuyers = this.buyersData.length;
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

  loadSellersData(): void {
    this.loading = true;

    this.firebaseService.getAllSellerForms().pipe(takeUntil(this.destroy$)).subscribe({
      next: (forms: any) => {
        if (forms) {
          this.sellersData = Object.entries(forms).map(([key, value]: [string, any]) => ({
            id: key,
            name: value.sellerName || 'N/A',
            email: value.email || 'N/A',
            mobileNo: value.contactNo || 'N/A',
            rawMaterialType: value.rawMaterialType || 'N/A',
            typicalCrops: value.rawMaterialType || 'N/A',
            quantity: value.quantity || 'N/A',
            location: value.location || 'N/A',
            village: value.location || 'N/A',
            pricePerUnit: value.pricePerUnit || 'N/A',
            harvestDate: value.harvestDate || 'N/A',
            qualityGrade: value.qualityGrade || 'standard',
            status: value.status || 'pending',
            createdAt: value.submittedAt || value.timestamp || null
          }));
        } else {
          this.sellersData = [];
        }
        this.stats.totalSellers = this.sellersData.length;
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

  loadServiceRequests(): void {
    this.loading = true;
    
    this.firebaseService.getAllServiceRequests().pipe(takeUntil(this.destroy$)).subscribe({
      next: (requests: any) => {
        if (requests) {
          this.serviceRequests = Object.entries(requests).map(([key, value]: [string, any]) => ({
            id: key,
            ...value
          }));
          this.stats.pendingServices = this.serviceRequests.filter((r) => !r.status || r.status === 'pending').length;
        } else {
          this.serviceRequests = [];
          this.stats.pendingServices = 0;
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

  loadSoilTestRequests(): void {
    this.loading = true;
    
    this.firebaseService.getAllSoilTestRequests().pipe(takeUntil(this.destroy$)).subscribe({
      next: (requests: any) => {
        if (requests) {
          this.soilTestRequests = Object.entries(requests).map(([key, value]: [string, any]) => ({
            id: key,
            ...value
          }));
          this.stats.pendingSoilTests = this.soilTestRequests.filter(
            (r) => !r.status || r.status === 'REQUESTED' || r.status === 'pending'
          ).length;
        } else {
          this.soilTestRequests = [];
          this.stats.pendingSoilTests = 0;
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

  updateRequestStatus(requestId: string, status: string, type: 'service' | 'soil'): void {
    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (type === 'service') {
      this.firebaseService.updateServiceRequest(requestId, updateData).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.showToast(`Service request marked as ${status.toUpperCase()}`, 'success');
          this.loadServiceRequests();
        },
        error: (err) => {
          this.showToast('Failed to update service request status', 'danger');
        }
      });
    } else {
      this.firebaseService.updateSoilTestRequest(requestId, updateData).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.showToast(`Soil test request marked as ${status.toUpperCase()}`, 'success');
          this.loadSoilTestRequests();
        },
        error: (err) => {
          this.showToast('Failed to update soil test status', 'danger');
        }
      });
    }
  }

  /**
   * Realtime Buyer-Seller Matchmaking Engine
   */
  matchBuyerSeller(): void {
    this.matchedPairs = [];
    const buyers = this.buyersData.length > 0 ? this.buyersData : [
      { name: 'FreshMart Organics', email: 'procure@freshmart.in', mobileNo: '9845012345', cropRequired: 'Tomato', quantity: '5000 Kg' },
      { name: 'AgriCorp Processing', email: 'sourcing@agricorp.com', mobileNo: '9876543210', cropRequired: 'Chilli', quantity: '2000 Kg' },
      { name: 'GreenMarket Retail', email: 'trade@greenmarket.org', mobileNo: '9123456789', cropRequired: 'Onion', quantity: '8000 Kg' },
      { name: 'Apex Agro Exports', email: 'export@apexagro.com', mobileNo: '9988776655', cropRequired: 'Cotton', quantity: '12000 Kg' }
    ];

    const sellers = this.sellersData.length > 0 ? this.sellersData : [
      { name: 'Sri Rama Agro Producers', email: 'srirama@farms.in', mobileNo: '9848011223', rawMaterialType: 'Tomato', quantity: '6000 Kg', location: 'Guntur, AP', pricePerUnit: '32' },
      { name: 'Krishna Valley Farmers', email: 'krishna@farmers.in', mobileNo: '9949022334', rawMaterialType: 'Chilli', quantity: '3500 Kg', location: 'Khammam, TS', pricePerUnit: '145' },
      { name: 'Godavari Fresh Harvest', email: 'godavari@produce.in', mobileNo: '9701033445', rawMaterialType: 'Onion', quantity: '10000 Kg', location: 'Kurnool, AP', pricePerUnit: '26' }
    ];

    buyers.forEach((buyer) => {
      const buyerReq = (buyer.cropRequired || buyer.productType || buyer.mainCategory || '').toLowerCase();
      
      sellers.forEach((seller) => {
        const sellerCrop = (seller.rawMaterialType || seller.typicalCrops || '').toLowerCase();
        
        let isMatch = false;
        let score = 70;

        if (buyerReq && sellerCrop && (buyerReq.includes(sellerCrop) || sellerCrop.includes(buyerReq))) {
          isMatch = true;
          score = 95;
        } else if (buyerReq.length > 3 && sellerCrop.length > 3 && (buyerReq.substring(0, 4) === sellerCrop.substring(0, 4))) {
          isMatch = true;
          score = 80;
        }

        if (isMatch) {
          this.matchedPairs.push({
            buyerName: buyer.name || 'Buyer',
            buyerEmail: buyer.email || '',
            buyerPhone: buyer.mobileNo || '',
            cropRequired: buyer.cropRequired || buyer.productType || 'Agricultural Produce',
            quantityRequired: String(buyer.quantity || '5000 Kg'),
            sellerName: seller.name || 'Agro Seller',
            sellerEmail: seller.email || '',
            sellerPhone: seller.mobileNo || '',
            sellerLocation: seller.location || seller.village || 'Regional Hub',
            availableQuantity: String(seller.quantity || 'Available'),
            pricePerUnit: seller.pricePerUnit ? `₹${seller.pricePerUnit}/Kg` : 'Competitive Quote',
            matchScore: score
          });
        }
      });
    });

    this.showMatchModal = true;
  }

  closeMatchModal(): void {
    this.showMatchModal = false;
  }

  private calculateAnalytics(farmers: any[]): void {
    if (!farmers || farmers.length === 0) return;

    // Soil type distribution
    const soilCounts = new Map<string, number>();
    const waterCounts = new Map<string, number>();
    let smallLand = 0;
    let mediumLand = 0;
    let largeLand = 0;

    farmers.forEach((f) => {
      const soil = (f.soilType || 'Unspecified').trim();
      soilCounts.set(soil, (soilCounts.get(soil) || 0) + 1);

      const water = (f.waterSource || 'Unspecified').trim();
      waterCounts.set(water, (waterCounts.get(water) || 0) + 1);

      const land = parseFloat(f.acreOfLand) || 0;
      if (land <= 2) smallLand++;
      else if (land <= 5) mediumLand++;
      else largeLand++;
    });

    const totalF = farmers.length;

    this.analytics.soilTypes = Array.from(soilCounts.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalF) * 100)
    }));

    this.analytics.waterSources = Array.from(waterCounts.entries()).map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / totalF) * 100)
    }));

    this.analytics.landDistribution = [
      { label: 'Small (< 2 Acres)', count: smallLand, percentage: Math.round((smallLand / totalF) * 100) },
      { label: 'Medium (2 - 5 Acres)', count: mediumLand, percentage: Math.round((mediumLand / totalF) * 100) },
      { label: 'Large (> 5 Acres)', count: largeLand, percentage: Math.round((largeLand / totalF) * 100) }
    ];
  }

  private updatePagination(): void {
    const query = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter.toLowerCase();

    const filterFn = (item: any, fields: string[]) => {
      const matchesQuery = !query || fields.some((field) => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(query);
      });

      const matchesStatus = status === 'all' || !item.status || String(item.status).toLowerCase() === status;
      return matchesQuery && matchesStatus;
    };

    let filtered: any[] = [];

    if (this.activeView === 'farmers') {
      filtered = this.farmersData.filter((f) => filterFn(f, ['name', 'village', 'cropsProduced', 'soilType', 'waterSource', 'mobileNo']));
      this.totalItems = filtered.length;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
      this.paginatedFarmers = this.sliceData(filtered);
    } else if (this.activeView === 'buyers') {
      filtered = this.buyersData.filter((b) => filterFn(b, ['name', 'email', 'mobileNo', 'cropRequired', 'mainCategory', 'productType']));
      this.totalItems = filtered.length;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
      this.paginatedBuyers = this.sliceData(filtered);
    } else if (this.activeView === 'sellers') {
      filtered = this.sellersData.filter((s) => filterFn(s, ['name', 'email', 'mobileNo', 'rawMaterialType', 'location', 'qualityGrade']));
      this.totalItems = filtered.length;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
      this.paginatedSellers = this.sliceData(filtered);
    } else if (this.activeView === 'service-requests') {
      filtered = this.serviceRequests.filter((r) => filterFn(r, ['farmerName', 'mobileNumber', 'village', 'serviceName', 'serviceType', 'selectedEquipment']));
      this.totalItems = filtered.length;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
      this.paginatedServiceRequests = this.sliceData(filtered);
    } else if (this.activeView === 'soil-tests') {
      filtered = this.soilTestRequests.filter((t) => filterFn(t, ['farmerName', 'mobileNumber', 'village', 'currentCrop']));
      this.totalItems = filtered.length;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
      this.paginatedSoilTests = this.sliceData(filtered);
    }
  }

  private sliceData(list: any[]): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  private showToast(message: string, type: 'success' | 'danger' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 4000);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  navigateToFarmers(): void { this.setActiveView('farmers'); }
  navigateToBuyers(): void { this.setActiveView('buyers'); }
  navigateToSellers(): void { this.setActiveView('sellers'); }
  navigateToReports(): void { this.setActiveView('reports'); }

  goBackToControl(): void {
    this.backToControl.emit();
  }

  trackByFn(index: number, item: any): any {
    return item?.id || item?.userId || item?.requestId || item?.name || index;
  }

  trackByIndex(index: number): number {
    return index;
  }
}