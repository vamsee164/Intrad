import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { FirebaseService } from '../services/firebase.service';
import { APP_CONSTANTS } from '../constants';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

interface ProfileData {
  name: string;
  location: string;
  phone: string;
  language: string;
  profileImage: string;
  roleSpecific: any;
}

interface EditForm {
  name: string;
  phone: string;
  village: string;
  mandal: string;
  acreOfLand: string;
  soilType: string;
  waterSource: string;
  fertilizers: string;
  typicalCrops: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentUser: User | null = null;
  profileData: ProfileData | null = null;

  // Edit-mode state
  isEditing = false;
  isSaving = false;
  saveError: string | null = null;
  saveSuccess = false;

  editForm: EditForm = {
    name: '',
    phone: '',
    village: '',
    mandal: '',
    acreOfLand: '',
    soilType: '',
    waterSource: '',
    fertilizers: '',
    typicalCrops: ''
  };

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
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
      case APP_CONSTANTS.ROLES.FARMER: return 'Farmer';
      case APP_CONSTANTS.ROLES.USER:   return 'Buyer User';
      case APP_CONSTANTS.ROLES.ADMIN:  return 'Admin User';
      default: return 'User';
    }
  }

  /** Open edit mode — pre-fill form from current user data */
  openEditMode(): void {
    if (!this.currentUser || !this.profileData) return;
    const u = this.currentUser;
    this.editForm = {
      name: u.name || '',
      phone: u.phone || u.profileData?.mobileNo || '',
      village: u.profileData?.village || '',
      mandal: u.profileData?.mandal || '',
      acreOfLand: u.profileData?.acreOfLand != null ? String(u.profileData.acreOfLand) : '',
      soilType: u.profileData?.soilType || '',
      waterSource: u.profileData?.waterSource || '',
      fertilizers: u.profileData?.fertilizers || '',
      typicalCrops: Array.isArray(u.profileData?.typicalCrops)
        ? u.profileData.typicalCrops.join(', ')
        : (u.profileData?.typicalCrops || '')
    };
    this.saveError = null;
    this.saveSuccess = false;
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.saveError = null;
    this.saveSuccess = false;
  }

  /** Save profile to Firebase Realtime Database and refresh UI */
  saveProfile(): void {
    if (!this.currentUser) return;
    this.isSaving = true;
    this.saveError = null;
    this.saveSuccess = false;

    const cropsArray = this.editForm.typicalCrops
      ? this.editForm.typicalCrops.split(',').map(c => c.trim()).filter(Boolean)
      : [];

    const payload: Record<string, any> = {
      name: this.editForm.name.trim(),
      mobileNo: this.editForm.phone.trim(),
      village: this.editForm.village.trim(),
      mandal: this.editForm.mandal.trim(),
      soilType: this.editForm.soilType.trim(),
      waterSource: this.editForm.waterSource.trim(),
      fertilizers: this.editForm.fertilizers.trim(),
      typicalCrops: cropsArray,
      acreOfLand: this.editForm.acreOfLand ? parseFloat(this.editForm.acreOfLand) : null
    };

    const userId = this.currentUser.id;

    this.firebaseService.updateUser(userId, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; })
      )
      .subscribe({
        next: () => {
          // Merge updates into local user and refresh AuthService + localStorage
          const updatedProfileData = { ...this.currentUser!.profileData, ...payload };
          const updatedUser: User = {
            ...this.currentUser!,
            name: payload['name'],
            phone: payload['mobileNo'],
            location: payload['village'],
            profileData: updatedProfileData
          };
          this.authService.setCurrentUser(updatedUser);
          this.saveSuccess = true;
          this.isEditing = false;
          setTimeout(() => { this.saveSuccess = false; }, 3000);
        },
        error: (err) => {
          console.error('Profile update failed:', err);
          this.saveError = 'Failed to update profile. Please try again.';
        }
      });
  }

  navigateBack(): void {
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