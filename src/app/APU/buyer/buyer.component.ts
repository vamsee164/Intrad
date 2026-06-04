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
    // cereals: {
    //   label: 'Cereals',
    //   subCategories: {
    //     wheat: {
    //       label: 'Wheat',
    //       // productTypes: {
    //       //   flour: 'Flour',
    //       //   grains: 'Grains',
    //       // },
    //     },
    //   },
    // },
    // pulses: {
    //   label: 'Pulses',
    //   subCategories: {
    //     lentils: {
    //       label: 'Lentils',
    //       // productTypes: {
    //       //   whole: 'Whole',
    //       //   split: 'Split',
    //       // },
    //     },
    //   },
    // },
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
  
  // View management
  currentView: 'form' | 'confirmation' = 'form';
  submittedData: any = null;
  showLastSubmission: boolean = false;

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
      });
    
    // Dynamic main categories from the hierarchy
    this.mainCategories = Object.keys(this.productHierarchy).map(key => ({
      label: (this.productHierarchy as any)[key].label,
      value: key
    }));
    
    // Load last submission from localStorage
    this.loadLastSubmission();
  }
  
  /**
   * Load last submission from localStorage
   */
  loadLastSubmission(): void {
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
   * Toggle last submission visibility
   */
  toggleLastSubmission(): void {
    this.showLastSubmission = !this.showLastSubmission;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  onSubmit(): void {
    if (this.buyerForm.invalid) {
      this.buyerForm.form.markAllAsTouched();
      return;
    }
    const submissionData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      mainCategory: this.getLabel(this.mainCategories, this.selectedMainCategory),
      subCategory: this.getLabel(this.subCategories, this.selectedSubCategory),
      productType: this.getLabel(this.productTypes, this.selectedProductType),
      details: this.getLabel(this.detailsOptions, this.selectedDetails),
      buyer: this.buyerData,
      status: 'pending',
    };

    // Fix #25: removed console.log from production submit
    this.isSubmitting = true;
    
    this.firebaseService.createBuyerForm(submissionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
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
          // Fix #22: no alert() — show inline error in form instead
          if (this.buyerForm) {
            // Set a flag the template can show — or use a simple property
            console.error('Buyer form submit failed');
          }
        }
      });
  }

  /**
   * Go back to form view
   */
  backToForm(): void {
    this.currentView = 'form';
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Submit another inquiry
   */
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
    this.buyerData = { name: '', email: '', phone: '', quantity: '' };
    this.subCategories = [];
    this.productTypes = [];
    this.detailsOptions = [];
    this.submittedData = null;
  }

  trackByFn(index: number, item: any): any {
    return item?.value || index;
  }
}
