import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

interface DropdownOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-buyer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buyer.component.html',
  styleUrls: ['./buyer.component.css'],
})
export class BuyerComponent implements OnInit, OnDestroy {
  @ViewChild('buyerForm') buyerForm!: NgForm;

  // Data structure for all dropdowns
  productHierarchy = {
    'fruits-vegetables': {
      label: 'Fruits & Vegetables',
      subCategories: {
        fruits: {
          label: 'Fruits',
          productTypes: {
            mango: {
              label: 'Mango',
              details: {
                slices: 'Slices',
                granules: 'Granules',
                powder: 'Powder',
              },
            },
            tomato: {
              label: 'Tomato',
              details: {
                diced: 'Diced',
                juice: 'Juice Concentrate',
              },
            },
            banana: {
              label: 'Banana',
              details: {
                chips: 'Chips',
                powder: 'Powder',
              },
            },
          },
        },
        vegetables: {
          label: 'Vegetables',
          productTypes: {
            onion: {
              label: 'Onion',
              details: {
                flakes: 'Flakes',
                powder: 'Powder',
              },
            },
            garlic: {
              label: 'Garlic',
              details: {
                flakes: 'Flakes',
                powder: 'Powder',
              },
            },
            ginger: {
              label: 'Ginger',
              details: {
                powder: 'Powder',
                slices: 'Slices',
              },
            },
            tomato: {
              label: 'Tomato',
              details: {
                powder: 'Powder',
                paste: 'Paste',
              },
            },
          },
        },
      },
    },

    RawVegetablesFruits: {
      label: 'Raw Vegetables & Fruits',
      subCategories: {
        fruits: {
          label: 'Fruits',
          productTypes: {
            mango: {
              label: 'Mango',
              details: {
                slices: 'Slices',
                granules: 'Granules',
                powder: 'Powder',
              },
            },
            tomato: {
              label: 'Tomato',
              details: {
                diced: 'Diced',
                juice: 'Juice Concentrate',
              },
            },
            banana: {
              label: 'Banana',
              details: {
                chips: 'Chips',
                powder: 'Powder',
              },
            },
          },
        },
        vegetables: {
          label: 'Vegetables',
          productTypes: {
            onion: {
              label: 'Onion',
              details: {
                flakes: 'Flakes',
                powder: 'Powder',
              },
            },
            garlic: {
              label: 'Garlic',
              details: {
                flakes: 'Flakes',
                powder: 'Powder',
              },
            },
            ginger: {
              label: 'Ginger',
              details: {
                powder: 'Powder',
                slices: 'Slices',
              },
            },
            tomato: {
              label: 'Tomato',
              details: {
                powder: 'Powder',
                paste: 'Paste',
              },
            },
          },
        },
      },
    },
  };

  // Dropdown options for the template
  mainCategories: DropdownOption[] = [];
  subCategories: DropdownOption[] = [];
  productTypes: DropdownOption[] = [];
  detailsOptions: DropdownOption[] = [];
  currentUser: User | null = null;

  selectedMainCategory = '';
  selectedSubCategory = '';
  selectedProductType = '';
  selectedDetails = '';

  buyerData = { name: '', email: '', phone: '', quantity: '' };

  // View management: 'form' | 'confirmation' | 'history'
  currentView: 'form' | 'confirmation' | 'history' = 'form';
  submittedData: any = null;

  // Order history
  orderHistory: any[] = [];
  isLoadingHistory = false;
  historyError: string | null = null;
  expandedOrderId: string | null = null;

  // Submission error flag
  submitError = false;

  // Flag to show last submission panel
  showLastSubmission = false;

  private readonly destroy$ = new Subject<void>();
  isSubmitting: boolean = false;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router,
  ) { }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
  logout(): void {
    this.authService.logout('/homepage');
  }
  backToAPU(): void {
    this.router.navigate(['/apu']);
  }
  goToControl(): void {
    this.router.navigate(['/control']);
  }

  onPhoneInput(event: any): void {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }
  }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.bindBuyerData(user);
          this.loadDatabaseData(user);
        }
      });

    // Dynamic main categories from the hierarchy
    this.mainCategories = Object.keys(this.productHierarchy).map((key) => ({
      label: (this.productHierarchy as any)[key].label,
      value: key,
    }));
  }

  /**
   * Bind buyer information from user / profileData
   */
  private bindBuyerData(user: User): void {
    const profile = user.profileData || {};

    if (!this.buyerData.name) {
      this.buyerData.name = user.name || profile.name || '';
    }
    if (!this.buyerData.email) {
      this.buyerData.email = user.email || profile.personalEmail || profile.email || '';
    }
    if (!this.buyerData.phone) {
      this.buyerData.phone = user.phone || profile.mobileNo || profile.phone || '';
    }
  }

  /**
   * Load previous buyer submissions and full profile from Firebase RTDB
   */
  private loadDatabaseData(user: User): void {
    const userEmail = user.email || user.profileData?.personalEmail;
    const userPhone = user.phone || user.profileData?.mobileNo;

    if (userEmail || userPhone) {
      this.firebaseService.getBuyerFormsByEmail(userEmail, userPhone)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (orders: any[]) => {
            this.orderHistory = orders || [];
            if (this.orderHistory.length > 0) {
              const latest = this.orderHistory[0];
              this.submittedData = latest;
              this.showLastSubmission = true;
            } else {
              this.loadLastSubmissionFromLocal();
            }
          },
          error: (err) => {
            console.warn('[BuyerComponent] Could not fetch database submissions:', err);
            this.loadLastSubmissionFromLocal();
          }
        });
    } else {
      this.loadLastSubmissionFromLocal();
    }

    // Complete missing profile data if needed
    if ((!this.buyerData.name || !this.buyerData.phone) && user.id) {
      this.firebaseService.getUser(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (dbUser) => {
            if (dbUser) {
              if (!this.buyerData.name) {
                this.buyerData.name = dbUser.name || '';
              }
              if (!this.buyerData.phone) {
                this.buyerData.phone = dbUser.mobileNo || dbUser.phone || '';
              }
            }
          },
          error: (err) => {
            console.warn('[BuyerComponent] User lookup error:', err);
          }
        });
    }
  }

  /**
   * Fallback: Load last submission from localStorage without forcing view change
   */
  private loadLastSubmissionFromLocal(): void {
    const lastSubmission = localStorage.getItem('lastBuyerSubmission');
    if (lastSubmission) {
      try {
        this.submittedData = JSON.parse(lastSubmission);
        this.showLastSubmission = true;
      } catch (error) {
        console.error('Error loading last submission:', error);
      }
    }
  }

  /**
   * Toggle expanded detail for an order card.
   */
  toggleOrderDetail(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  backToFormFromHistory(): void {
    this.currentView = 'form';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Dropdown Cascade ────────────────────────────────────────

  onMainCategoryChange(): void {
    this.selectedSubCategory = '';
    this.selectedProductType = '';
    this.selectedDetails = '';
    this.subCategories = [];
    this.productTypes = [];
    this.detailsOptions = [];

    const category = (this.productHierarchy as any)[this.selectedMainCategory];
    if (category?.subCategories) {
      this.subCategories = Object.keys(category.subCategories).map((key) => ({
        label: category.subCategories[key].label,
        value: key,
      }));
    }
  }

  onSubCategoryChange(): void {
    this.selectedProductType = '';
    this.selectedDetails = '';
    this.productTypes = [];
    this.detailsOptions = [];

    const category = (this.productHierarchy as any)[this.selectedMainCategory];
    const subCat = category?.subCategories?.[this.selectedSubCategory];
    if (subCat?.productTypes) {
      this.productTypes = Object.keys(subCat.productTypes).map((key) => ({
        label: subCat.productTypes[key].label,
        value: key,
      }));
    }
  }

  onProductTypeChange(): void {
    this.selectedDetails = '';
    this.detailsOptions = [];

    const category = (this.productHierarchy as any)[this.selectedMainCategory];
    const subCat = category?.subCategories?.[this.selectedSubCategory];
    const prodType = subCat?.productTypes?.[this.selectedProductType];
    if (prodType?.details) {
      this.detailsOptions = Object.keys(prodType.details).map((key) => ({
        label: prodType.details[key],
        value: key,
      }));
    }
  }

  getLabel(options: DropdownOption[], value: string): string {
    const found = options.find((option) => option.value === value);
    return found ? found.label : value;
  }

  // ── Submit ──────────────────────────────────────────────────

  onSubmit(): void {
    if (this.buyerForm.invalid) {
      this.buyerForm.form.markAllAsTouched();
      return;
    }
    this.submitError = false;
    const submissionData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      mainCategory: this.getLabel(
        this.mainCategories,
        this.selectedMainCategory,
      ),
      subCategory: this.getLabel(this.subCategories, this.selectedSubCategory),
      productType: this.getLabel(this.productTypes, this.selectedProductType),
      details: this.getLabel(this.detailsOptions, this.selectedDetails),
      buyer: { ...this.buyerData },
      status: 'pending',
    };

    this.isSubmitting = true;

    this.firebaseService.createBuyerForm(submissionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_response) => {
          this.isSubmitting = false;
          // Save to localStorage for future reference
          localStorage.setItem('lastBuyerSubmission', JSON.stringify(submissionData));

          // Store submitted data and show confirmation
          this.submittedData = submissionData;
          this.currentView = 'confirmation';

          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (_error) => {
          this.isSubmitting = false;
          this.submitError = true;
        }
      });
  }

  // ── Navigation ──────────────────────────────────────────────

  backToForm(): void {
    this.currentView = 'form';
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submitAnother(): void {
    this.currentView = 'form';
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Resets all form selections.
   */
  resetForm(): void {
    this.selectedMainCategory = '';
    this.selectedSubCategory = '';
    this.selectedProductType = '';
    this.selectedDetails = '';
    const user = this.currentUser;
    const profile = user?.profileData || {};
    this.buyerData = {
      name: user?.name || profile.name || '',
      email: user?.email || profile.personalEmail || profile.email || '',
      phone: user?.phone || profile.mobileNo || profile.phone || '',
      quantity: ''
    };
    this.subCategories = [];
    this.productTypes = [];
    this.detailsOptions = [];
    this.submittedData = null;
    this.submitError = false;
  }

  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  }

  getStatusIcon(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'bi-check-circle-fill';
      case 'rejected': return 'bi-x-circle-fill';
      default: return 'bi-hourglass-split';
    }
  }

  trackByFn(index: number, item: any): any {
    return item?.value || index;
  }

  trackByOrderId(index: number, order: any): any {
    return order?.id || order?.formId || index;
  }

  /**
   * Navigate to the order history view and load orders from Firebase.
   */
  viewHistory(): void {
    this.currentView = 'history';
    this.isLoadingHistory = true;
    this.historyError = null;
    this.orderHistory = [];
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const userEmail = this.currentUser?.email;
    const fetch$ = userEmail
      ? this.firebaseService.getBuyerFormsByEmail(userEmail)
      : this.firebaseService.getAllBuyerForms().pipe(
        map((forms: any) => forms ? Object.values(forms) : [])
      );

    fetch$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders: any[]) => {
          this.orderHistory = orders || [];
          this.isLoadingHistory = false;
        },
        error: (_err: any) => {
          this.historyError = 'Failed to load order history. Please try again.';
          this.isLoadingHistory = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
