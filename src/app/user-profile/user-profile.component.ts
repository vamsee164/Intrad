import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { APP_CONSTANTS } from '../constants';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ProfileData {
  name: string;
  location: string;
  phone: string;
  language: string;
  profileImage: string;
  roleSpecific: any;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentUser: User | null = null;
  profileData: ProfileData | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) this.loadProfileData(user);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfileData(user: User): void {
    const phoneNumber = user.phone || user.profileData?.mobileNo || user.profileData?.phone || '';
    const baseProfile = {
      name: user.name || this.getUserName(user.role),
      // Fix #11: no hardcoded location fallback — show N/A if missing
      location: user.location || user.profileData?.village || user.profileData?.location || 'N/A',
      phone: phoneNumber,
      language: 'తెలుగు',
      profileImage: user.profileData?.profileImage || 'assets/images/default-avatar.svg'
    };

    switch (user.role) {
      case APP_CONSTANTS.ROLES.FARMER:
        this.profileData = {
          ...baseProfile,
          roleSpecific: {
            // Fix #11: use 'N/A' fallbacks, not fake data
            land: user.profileData?.acreOfLand != null ? user.profileData.acreOfLand + ' Acres' : 'N/A',
            crops: Array.isArray(user.profileData?.typicalCrops)
              ? user.profileData.typicalCrops.join(', ') || 'N/A'
              : (user.profileData?.typicalCrops || 'N/A'),
            soilType: user.profileData?.soilType || 'N/A',
            village: user.profileData?.village || user.location || 'N/A',
            mandal: user.profileData?.mandal || 'N/A',
            waterSource: user.profileData?.waterSource || 'N/A',
            fertilizers: user.profileData?.fertilizers || 'N/A',
            soilTest: user.profileData?.soilTest || 'not-tested',
            email: user.email || 'N/A',
            userId: user.profileData?.userId || user.id || 'N/A',
            createdAt: user.profileData?.createdAt || 'N/A'
          }
        };
        break;
      case APP_CONSTANTS.ROLES.USER:
        this.profileData = {
          ...baseProfile,
          roleSpecific: {
            orders: user.profileData?.orders || 15,
            totalSpent: user.profileData?.totalSpent || '₹25,000',
            preferredCrops: user.profileData?.preferredCrops || 'Vegetables, Fruits'
          }
        };
        break;
      case APP_CONSTANTS.ROLES.ADMIN:
        this.profileData = {
          ...baseProfile,
          roleSpecific: {
            totalUsers: user.profileData?.totalUsers || 1250,
            totalFarmers: user.profileData?.totalFarmers || 850,
            totalOrders: user.profileData?.totalOrders || 3500
          }
        };
        break;
      default:
        this.profileData = baseProfile as ProfileData;
    }
  }

  private getUserName(role: string): string {
    switch (role) {
      case APP_CONSTANTS.ROLES.FARMER:
        return 'Farmer';
      case APP_CONSTANTS.ROLES.USER:
        return 'Buyer User';
      case APP_CONSTANTS.ROLES.ADMIN:
        return 'Admin User';
      default:
        return 'User';
    }
  }

  navigateBack(): void {
    this.router.navigate([this.getDashboardRoute()]);
  }

  navigateToEditProfile(): void {
    // Route to the dashboard where profile editing is available
    this.router.navigate([this.getDashboardRoute()]);
  }

  navigateToMyCrops(): void {
    this.router.navigate(['/crops/vegetables']);
  }

  navigateToSoilTest(): void {
    this.router.navigate(['/booksoil']);
  }

  navigateToMarketPrices(): void {
    this.router.navigate(['/crops/vegetables']);
  }

  navigateToHelpCenter(): void {
    this.router.navigate(['/contact']);
  }

  logout(): void {
    this.authService.logout('/homepage');
  }

  private getDashboardRoute(): string {
    if (!this.currentUser) return '/homepage';
    
    switch (this.currentUser.role) {
      case APP_CONSTANTS.ROLES.FARMER:
        return '/farmer';
      case APP_CONSTANTS.ROLES.USER:
      case 'buyer':
        return '/apu/buyer';
      case 'seller':
        return '/apu/seller';
      case APP_CONSTANTS.ROLES.ADMIN:
        return '/control';
      default:
        return '/homepage';
    }
  }
}