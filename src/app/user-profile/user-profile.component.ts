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
  companyName?: string;
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
  phoneError: string | null = null;

  editForm: EditForm = {
    name: '',
    phone: '',
    village: '',
    mandal: '',
    companyName: '',
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
    const baseLocation = user.location || (user.profileData?.village
      ? (user.profileData?.mandal ? `${user.profileData.village}, ${user.profileData.mandal}` : user.profileData.village)
      : (user.profileData?.location || 'N/A'));

    const baseProfile = {
      name: user.name || this.getUserName(user.role),
      location: baseLocation,
      phone: phoneNumber,
      language: 'తెలుగు / English',
      profileImage: user.profileData?.profileImage || 'assets/images/default-avatar.svg'
    };

    switch (user.role) {
      case APP_CONSTANTS.ROLES.FARMER:
        this.profileData = {
          ...baseProfile,
          roleSpecific: {
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

      case 'buyer':
      case APP_CONSTANTS.ROLES.USER:
        this.profileData = {
          ...baseProfile,
          roleSpecific: {
            companyName: user.profileData?.companyName || 'Individual Buyer',
            village: user.profileData?.village || user.location || 'N/A',
            mandal: user.profileData?.mandal || 'N/A',
            preferredCrops: Array.isArray(user.profileData?.typicalCrops)
              ? user.profileData.typicalCrops.join(', ') || 'Fruits, Vegetables'
              : (user.profileData?.typicalCrops || 'Fruits, Vegetables'),
            inquiriesCount: 0,
            email: user.email || 'N/A',
            userId: user.profileData?.userId || user.id || 'N/A'
          }
        };
        // Load inquiry count from database
        this.firebaseService.getBuyerFormsByEmail(user.email, phoneNumber)
          .pipe(takeUntil(this.destroy$))
          .subscribe(orders => {
            if (this.profileData?.roleSpecific) {
              this.profileData.roleSpecific.inquiriesCount = orders?.length || 0;
            }
          });
        break;

      case 'seller':
        this.profileData = {
          ...baseProfile,
          roleSpecific: {
            village: user.profileData?.village || user.location || 'N/A',
            mandal: user.profileData?.mandal || 'N/A',
            rawMaterials: Array.isArray(user.profileData?.typicalCrops)
              ? user.profileData.typicalCrops.join(', ') || 'N/A'
              : (user.profileData?.typicalCrops || 'N/A'),
            offersCount: 0,
            email: user.email || 'N/A',
            userId: user.profileData?.userId || user.id || 'N/A'
          }
        };
        // Load offers count from database
        this.firebaseService.getSellerFormsByEmail(user.email, phoneNumber)
          .pipe(takeUntil(this.destroy$))
          .subscribe(offers => {
            if (this.profileData?.roleSpecific) {
              this.profileData.roleSpecific.offersCount = offers?.length || 0;
            }
          });
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
      case 'buyer':                    return 'Buyer';
      case 'seller':                   return 'Seller';
      case APP_CONSTANTS.ROLES.ADMIN:  return 'Admin User';
      default: return 'User';
    }
  }

  /** Open edit mode — pre-fill form from current user data */
  openEditMode(): void {
    if (!this.currentUser || !this.profileData) return;
    const u = this.currentUser;
    const p = u.profileData || {};

    this.editForm = {
      name: u.name || p.name || '',
      phone: u.phone || p.mobileNo || p.phone || '',
      village: p.village || '',
      mandal: p.mandal || '',
      companyName: p.companyName || '',
      acreOfLand: p.acreOfLand != null ? String(p.acreOfLand) : '',
      soilType: p.soilType || '',
      waterSource: p.waterSource || '',
      fertilizers: p.fertilizers || '',
      typicalCrops: Array.isArray(p.typicalCrops)
        ? p.typicalCrops.join(', ')
        : (p.typicalCrops || '')
    };
    this.saveError = null;
    this.saveSuccess = false;
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.saveError = null;
    this.saveSuccess = false;
    this.phoneError = null;
  }

  /** Strip non-digit chars and enforce 10-digit max on phone input */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let cleaned = input.value.replace(/[^0-9]/g, '');
    if (cleaned.length > 10) {
      cleaned = cleaned.slice(0, 10);
    }
    input.value = cleaned;
    this.editForm.phone = cleaned;
    // Live validation feedback
    if (cleaned.length > 0 && cleaned.length < 10) {
      this.phoneError = 'Phone number must be exactly 10 digits';
    } else {
      this.phoneError = null;
    }
  }

  /** Returns true only when phone is empty (optional) or exactly 10 digits */
  get isPhoneValid(): boolean {
    const p = (this.editForm.phone || '').trim();
    return p.length === 0 || /^[0-9]{10}$/.test(p);
  }

  /** Save profile to Firebase Realtime Database and refresh UI */
  saveProfile(): void {
    if (!this.currentUser) return;

    // Guard: phone must be empty or exactly 10 digits
    if (!this.isPhoneValid) {
      this.phoneError = 'Phone number must be exactly 10 digits';
      return;
    }

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
      companyName: (this.editForm.companyName || '').trim(),
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
          const updatedLocation = payload['village']
            ? (payload['mandal'] ? `${payload['village']}, ${payload['mandal']}` : payload['village'])
            : (this.currentUser!.location || '');

          const updatedUser: User = {
            ...this.currentUser!,
            name: payload['name'],
            phone: payload['mobileNo'],
            location: updatedLocation,
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
    this.router.navigate(['/products']);
  }

  navigateToHelpCenter(): void {
    this.router.navigate(['/contact']);
  }

  navigateToBuyerPortal(): void {
    this.router.navigate(['/apu/buyer']);
  }

  navigateToSellerPortal(): void {
    this.router.navigate(['/apu/seller']);
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