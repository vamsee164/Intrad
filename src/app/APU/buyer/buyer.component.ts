import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface DropdownOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-buyer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buyer.component.html',
  styleUrls: ['./buyer.component.css']
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
    // Fix #17: corrected typo 'Furits' → 'Fruits'
    RawVegetablesFruits: {
      label: 'Raw Vegetables & Fruits',
      subCategories: {
        lentils: {
          label: 'Lentils',
          productTypes: {
            // whole: 'Whole',
            // split: 'Split',
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

  private readonly destroy$ = new Subject<void>();
  isSubmitting: boolean = false;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  goToProfile(): void { this.router.navigate(['/profile']); }
  logout(): void { this.authService.logout('/homepage'); }
  backToAPU(): void { this.router.navigate(['/apu']); }
  goToControl(): void { this.router.navigate(['/control']); }

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
      .subscribe(user => {
        this.currentUser = user;
        // Pre-fill email from logged-in user
        if (user?.email && !this.buyerData.email) {
          this.buyerData.email = user.email;
        }
        if (user?.name && !this.buyerData.name) {
          this.buyerData.name = user.name;
        }
        if (user?.phone && !this.buyerData.phone) {
          this.buyerData.phone = user.phone;
        }
      });

    // Dynamic main categories from the hierarchy
    this.mainCategories = Object.keys(this.productHierarchy).map(key => ({
      label: (this.productHierarchy as any)[key].label,
      value: key
    }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Order History ───────────────────────────────────────────

  /**
   * Load order history for the current buyer from Firebase,
   * filtered by their email address. Shows the history view.
   */
  viewHistory(): void {
    if (!this.currentUser?.email) return;

    this.currentView = 'history';
    this.isLoadingHistory = true;
    this.historyError = null;
    this.orderHistory = [];

    this.firebaseService.getBuyerFormsByEmail(this.currentUser.email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.isLoadingHistory = false;
          this.orderHistory = orders;
        },
        error: (_err) => {
          this.isLoadingHistory = false;
          this.historyError = 'Unable to load order history. Please try again.';
        }
      });

    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      this.subCategories = Object.keys(category.subCategories).map(key => ({
        label: category.subCategories[key].label,
        value: key
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
      this.productTypes = Object.keys(subCat.productTypes).map(key => ({
        label: subCat.productTypes[key].label,
        value: key
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
      this.detailsOptions = Object.keys(prodType.details).map(key => ({
        label: prodType.details[key],
        value: key
      }));
    }
  }

  getLabel(options: DropdownOption[], value: string): string {
    const found = options.find(option => option.value === value);
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
      mainCategory: this.getLabel(this.mainCategories, this.selectedMainCategory),
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
          this.submittedData = submissionData;
          this.currentView = 'confirmation';
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
    this.buyerData = {
      name: this.currentUser?.name || '',
      email: this.currentUser?.email || '',
      phone: this.currentUser?.phone || '',
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
}
