import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface DashboardCard {
  title: string;
  icon: string;
  value: string | number;
  description: string;
  color: string;
}

interface QuickAction {
  title: string;
  icon: string;
  route: string;
  description: string;
}

interface Worker {
  name: string;
  role: string;
  icon: string;
  experience: string;
  pricePerDay: string;
  skills: string[];
  available: boolean;
}

interface ServicePackage {
  id: string;
  name: string;
  icon: string;
  description: string;
  price: string;
  features: string[];
  popular?: boolean;
  equipmentList?: EquipmentItem[];
}

interface EquipmentItem {
  name: string;
  icon: string;
  description: string;
  pricePerDay: string;
  specifications?: string[];
}

@Component({
  selector: 'app-farmer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './farmer-dashboard.component.html',
  styleUrls: ['./farmer-dashboard.component.css']
})
export class FarmerDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  currentUser: User | null = null;
  dashboardCards: DashboardCard[] = [];
  quickActions: QuickAction[] = [];
  recentActivities: any[] = [];
  servicePackages: ServicePackage[] = [];
  workers: Worker[] = [];
  workerForm = { farmerName: '', mobileNumber: '', village: '', workerType: '', numberOfWorkers: 1, startDate: '', duration: '', additionalNotes: '' };
  selectedWorker: Worker | null = null;
  currentView: 'dashboard' | 'service-form' = 'dashboard'; // worker-form removed (unimplemented)
  selectedService: ServicePackage | null = null;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'warning' = 'success';
  showToastFlag = false;
  private toastTimer: any = null;
  
  // Service form data
  serviceForm = {
    farmerName: '',
    mobileNumber: '',
    village: '',
    serviceType: '',
    preferredDate: '',
    additionalNotes: '',
    selectedEquipment: '' // For equipment rental
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.loadDashboardData();
        if (user) {
          this.serviceForm.farmerName = user.name || '';
          this.serviceForm.mobileNumber = user.phone || user.profileData?.mobileNo || '';
          this.serviceForm.village = user.profileData?.village || user.location || '';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  /** Replacement for alert() — shows an in-page toast banner */
  showToast(message: string, type: 'success' | 'danger' | 'warning' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToastFlag = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.showToastFlag = false; }, 4000);
  }

  private loadDashboardData(): void {
    this.dashboardCards = [
      {
        title: 'Total Land',
        icon: '🌾',
        value: this.currentUser?.profileData?.acreOfLand || '5 acres',
        description: 'Registered farmland',
        color: '#28a745'
      },
      {
        title: 'Active Crops',
        icon: '🌱',
        // Fix #10: typicalCrops is string[], not a comma-separated string
        value: Array.isArray(this.currentUser?.profileData?.typicalCrops)
          ? this.currentUser!.profileData.typicalCrops.length
          : (this.currentUser?.profileData?.typicalCrops
              ? (this.currentUser.profileData.typicalCrops as string).split(',').filter(Boolean).length
              : 0),
        description: 'Currently growing',
        color: '#20c997'
      },
      {
        title: 'Soil Tests',
        icon: '🧪',
        value: this.currentUser?.profileData?.soilTest || 'Pending',
        description: 'Last test status',
        color: '#17a2b8'
      },
      {
        title: 'Water Source',
        icon: '💧',
        value: this.currentUser?.profileData?.waterSource || 'Borewell',
        description: 'Primary source',
        color: '#007bff'
      }
    ];

    this.quickActions = [
      {
        title: 'Browse Products',
        icon: '🛒',
        route: '/homepage',
        description: 'View available products'
      },
      {
        title: 'Book Soil Test',
        icon: '🧪',
        route: '/booksoil',
        description: 'Schedule soil testing'
      },
      {
        title: 'View Crops',
        icon: '🌾',
        route: '/crops/vegetables',
        description: 'Browse crop catalog'
      },
      {
        title: 'My Profile',
        icon: '👤',
        route: '/profile',
        description: 'Update your information'
      },
      {
        title: 'Contact Support',
        icon: '📞',
        route: '/contact',
        description: 'Get help and support'
      },
      {
        title: 'About Us',
        icon: 'ℹ️',
        route: '/about',
        description: 'Learn more about us'
      }
    ];

    this.recentActivities = [
      { action: 'Logged in', time: 'Just now', icon: '🔐' },
      { action: 'Viewed product catalog', time: '2 hours ago', icon: '👁️' },
      { action: 'Updated profile', time: '1 day ago', icon: '✏️' }
    ];

    this.servicePackages = [
      {
        id: 'soil-testing',
        name: 'Soil Testing',
        icon: '🧪',
        description: 'Comprehensive soil analysis for optimal crop planning',
        price: '₹500',
        features: [
          'pH Level Analysis',
          'Nutrient Content Check',
          'Fertilizer Recommendations',
          'Detailed Report'
        ]
      },
      {
        id: 'crop-advisory',
        name: 'Crop Advisory',
        icon: '🌱',
        description: 'Expert guidance on crop selection and management',
        price: '₹1,000/month',
        features: [
          'Seasonal Crop Planning',
          'Pest & Disease Management',
          'Weather-based Advice',
          '24/7 Expert Support'
        ],
        popular: true
      },
      {
        id: 'market-linkage',
        name: 'Market Linkage',
        icon: '🤝',
        description: 'Connect with buyers and get best prices',
        price: '₹2,000/year',
        features: [
          'Direct Buyer Connection',
          'Price Negotiation Support',
          'Quality Certification',
          'Logistics Assistance'
        ]
      },
      {
        id: 'equipment-rental',
        name: 'Equipment Rental',
        icon: '🚜',
        description: 'Access modern farming equipment on rent',
        price: '₹300/day',
        features: [
          'Tractors & Harvesters',
          'Sprayers & Tillers',
          'Delivery & Pickup',
          'Operator Training'
        ],
        equipmentList: [
          {
            name: 'Tractor (50 HP)',
            icon: '🚜',
            description: 'Heavy-duty tractor for plowing and cultivation',
            pricePerDay: '₹800',
            specifications: [
              '50 HP Engine',
              'Fuel Efficient',
              'Suitable for 5-10 acres',
              'Includes basic attachments'
            ]
          },
          {
            name: 'Tractor (35 HP)',
            icon: '🚜',
            description: 'Medium-duty tractor for general farming',
            pricePerDay: '₹600',
            specifications: [
              '35 HP Engine',
              'Easy to operate',
              'Suitable for 2-5 acres',
              'Includes rotavator'
            ]
          },
          {
            name: 'Combine Harvester',
            icon: '🌾',
            description: 'Automated harvesting machine',
            pricePerDay: '₹1,500',
            specifications: [
              'Multi-crop harvesting',
              'High efficiency',
              'Suitable for 10+ acres',
              'Operator included'
            ]
          },
          {
            name: 'Rotavator',
            icon: '⚙️',
            description: 'Soil preparation and tilling equipment',
            pricePerDay: '₹400',
            specifications: [
              'Width: 5-7 feet',
              'Depth: 6-8 inches',
              'Suitable for all soil types',
              'Tractor attachment'
            ]
          },
          {
            name: 'Power Tiller',
            icon: '🔧',
            description: 'Compact tilling machine for small farms',
            pricePerDay: '₹350',
            specifications: [
              '8-10 HP Engine',
              'Lightweight & portable',
              'Suitable for 1-2 acres',
              'Easy to maneuver'
            ]
          },
          {
            name: 'Sprayer (Power)',
            icon: '💧',
            description: 'Motorized sprayer for pesticides and fertilizers',
            pricePerDay: '₹250',
            specifications: [
              '200L capacity',
              'Adjustable nozzles',
              'Battery operated',
              'Covers 5 acres/day'
            ]
          },
          {
            name: 'Seed Drill',
            icon: '🌱',
            description: 'Precision seed planting equipment',
            pricePerDay: '₹500',
            specifications: [
              'Multi-row planting',
              'Adjustable spacing',
              'Suitable for all seeds',
              'Tractor attachment'
            ]
          },
          {
            name: 'Cultivator',
            icon: '⛏️',
            description: 'Soil cultivation and weed removal',
            pricePerDay: '₹300',
            specifications: [
              '5-7 tines',
              'Adjustable depth',
              'Weed control',
              'Tractor attachment'
            ]
          },
          {
            name: 'Thresher',
            icon: '🌾',
            description: 'Grain separation machine',
            pricePerDay: '₹600',
            specifications: [
              'Multi-crop threshing',
              'High capacity',
              'Electric/Diesel options',
              'Minimal grain damage'
            ]
          },
          {
            name: 'Water Pump (Diesel)',
            icon: '💦',
            description: 'High-capacity irrigation pump',
            pricePerDay: '₹400',
            specifications: [
              '5 HP Diesel engine',
              '3-inch outlet',
              'Portable',
              'Fuel efficient'
            ]
          }
        ]
      },
      {
        id: 'insurance',
        name: 'Crop Insurance',
        icon: '🛡️',
        description: 'Protect your crops from natural calamities',
        price: '₹5,000/season',
        features: [
          'Weather Risk Coverage',
          'Pest Attack Protection',
          'Quick Claim Settlement',
          'Government Subsidy Support'
        ]
      },
      {
        id: 'training',
        name: 'Training Programs',
        icon: '🎓',
        description: 'Learn modern farming techniques',
        price: 'Free',
        features: [
          'Organic Farming Methods',
          'Water Conservation',
          'Sustainable Practices',
          'Certificate on Completion'
        ]
      }
    ];

    this.workers = [
      {
        name: 'Field Labourers',
        role: 'General Farm Work',
        icon: '👨‍🌾',
        experience: '2+ years',
        pricePerDay: '₹400/day',
        skills: ['Planting', 'Weeding', 'Harvesting', 'Irrigation'],
        available: true
      },
      {
        name: 'Harvesting Team',
        role: 'Crop Harvesting',
        icon: '🌾',
        experience: '3+ years',
        pricePerDay: '₹500/day',
        skills: ['Manual Harvesting', 'Machine Operation', 'Sorting', 'Packing'],
        available: true
      },
      {
        name: 'Spray Operator',
        role: 'Pesticide & Fertilizer',
        icon: '💧',
        experience: '2+ years',
        pricePerDay: '₹450/day',
        skills: ['Pesticide Spraying', 'Fertilizer Application', 'Safety Protocols', 'Equipment Handling'],
        available: true
      },
      {
        name: 'Tractor Operator',
        role: 'Machine Operation',
        icon: '🚜',
        experience: '5+ years',
        pricePerDay: '₹700/day',
        skills: ['Tractor Driving', 'Plowing', 'Rotavating', 'Seed Drilling'],
        available: false
      },
      {
        name: 'Irrigation Worker',
        role: 'Water Management',
        icon: '💦',
        experience: '2+ years',
        pricePerDay: '₹380/day',
        skills: ['Drip Irrigation', 'Canal Management', 'Pump Operation', 'Water Scheduling'],
        available: true
      },
      {
        name: 'Nursery Worker',
        role: 'Seedling & Nursery',
        icon: '🌱',
        experience: '1+ years',
        pricePerDay: '₹350/day',
        skills: ['Seed Sowing', 'Transplanting', 'Nursery Care', 'Grafting'],
        available: true
      }
    ];
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  selectPackage(packageId: string): void {
    const selectedPkg = this.servicePackages.find(pkg => pkg.id === packageId);
    if (selectedPkg) {
      this.selectedService = selectedPkg;
      this.serviceForm.serviceType = selectedPkg.name;
      this.currentView = 'service-form';
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  backToDashboard(): void {
    this.currentView = 'dashboard';
    this.selectedService = null;
    this.resetServiceForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submitServiceRequest(): void {
    if (!this.serviceForm.farmerName || !this.serviceForm.mobileNumber || !this.serviceForm.preferredDate) {
      this.showToast('Please fill in all required fields', 'warning');
      return;
    }
    if (this.selectedService?.id === 'equipment-rental' && !this.serviceForm.selectedEquipment) {
      this.showToast('Please select an equipment', 'warning');
      return;
    }
    const requestData = {
      ...this.serviceForm,
      serviceId: this.selectedService?.id,
      serviceName: this.selectedService?.name,
      servicePrice: this.selectedService?.price,
      farmerEmail: this.currentUser?.email,
      farmerId: this.currentUser?.id
    };
    this.firebaseService.createServiceRequest(requestData).subscribe({
      next: (response) => {
        this.showToast(`Service request for ${this.serviceForm.serviceType} submitted! ID: ${response.name}`, 'success');
        this.backToDashboard();
      },
      error: () => this.showToast('Failed to submit service request. Please try again.', 'danger')
    });
  }

  resetServiceForm(): void {
    this.serviceForm = {
      farmerName: this.currentUser?.name || '',
      mobileNumber: this.currentUser?.phone || this.currentUser?.profileData?.mobileNo || this.currentUser?.profileData?.phone || '',
      village: this.currentUser?.profileData?.village || this.currentUser?.location || '',
      serviceType: '',
      preferredDate: '',
      additionalNotes: '',
      selectedEquipment: ''
    };
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout('/homepage');
  }

  trackByFn(index: number, item: any): any {
    return item?.id || item?.name || item?.title || index;
  }
}
