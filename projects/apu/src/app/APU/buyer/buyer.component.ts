// src/app/buyer/buyer.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // For *ngIf, *ngFor
import { FormsModule, NgForm } from '@angular/forms'; // For [(ngModel)]

interface DropdownOption {
  label: string;
  value: string;
}

interface ProductData {
  [key: string]: {
    label: string;
    subCategories?: {
      [key: string]: {
        label: string;
        productTypes?: {
          [key: string]: {
            label: string;
            details?: {
              [key: string]: string; // value: label
            };
          };
        };
      };
    };
  };
}

@Component({
  selector: 'app-buyer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buyer.component.html',
  styleUrls: ['./buyer.component.css'],
})
export class BuyerComponent implements OnInit {
  // Data structure for all dropdowns
  productHierarchy: ProductData = {
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
            apple: {
              label: 'Apple',
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
    cereals: {
      label: 'Cereals',
      subCategories: {
        wheat: {
          label: 'Wheat',
          // productTypes: {
          //   flour: 'Flour',
          //   grains: 'Grains',
          // },
        },
      },
    },
    pulses: {
      label: 'Pulses',
      subCategories: {
        lentils: {
          label: 'Lentils',
          // productTypes: {
          //   whole: 'Whole',
          //   split: 'Split',
          // },
        },
      },
    },
  };

  // Dropdown options for the template
  mainCategories: DropdownOption[] = [];
  subCategories: DropdownOption[] = [];
  productTypes: DropdownOption[] = [];
  detailsOptions: DropdownOption[] = [];

  // Selected values from dropdowns
  selectedMainCategory: string = '';
  selectedSubCategory: string = '';
  selectedProductType: string = '';
  selectedDetails: string = '';

  constructor() {}

  ngOnInit(): void {
    this.populateMainCategories();
  }

  /**
   * Populates the main category dropdown.
   */
  populateMainCategories(): void {
    this.mainCategories = Object.keys(this.productHierarchy).map((key) => ({
      label: this.productHierarchy[key].label,
      value: key,
    }));
  }

  /**
   * Handles change event for the main category dropdown.
   * Populates sub-categories and resets subsequent selections.
   */
  onMainCategoryChange(): void {
    this.selectedSubCategory = '';
    this.selectedProductType = '';
    this.selectedDetails = '';
    this.subCategories = [];
    this.productTypes = [];
    this.detailsOptions = [];

    const selectedCategory = this.productHierarchy[this.selectedMainCategory];
    if (selectedCategory && selectedCategory.subCategories) {
      this.subCategories = Object.keys(selectedCategory.subCategories).map(
        (key) => ({
          label: selectedCategory.subCategories![key].label,
          value: key,
        })
      );
    }
  }

  /**
   * Handles change event for the sub-category dropdown.
   * Populates product types and resets subsequent selections.
   */
  onSubCategoryChange(): void {
    this.selectedProductType = '';
    this.selectedDetails = '';
    this.productTypes = [];
    this.detailsOptions = [];

    const selectedCategory = this.productHierarchy[this.selectedMainCategory];
    const selectedSubCategory =
      selectedCategory?.subCategories?.[this.selectedSubCategory];

    if (selectedSubCategory && selectedSubCategory.productTypes) {
      this.productTypes = Object.keys(selectedSubCategory.productTypes).map(
        (key) => ({
          label: selectedSubCategory.productTypes![key].label,
          value: key,
        })
      );
    }
  }

  /**
   * Handles change event for the product type dropdown.
   * Populates details options.
   */
  onProductTypeChange(): void {
    this.selectedDetails = '';
    this.detailsOptions = [];

    const selectedCategory = this.productHierarchy[this.selectedMainCategory];
    const selectedSubCategory =
      selectedCategory?.subCategories?.[this.selectedSubCategory];
    const selectedProductType =
      selectedSubCategory?.productTypes?.[this.selectedProductType];

    if (selectedProductType && selectedProductType.details) {
      this.detailsOptions = Object.keys(selectedProductType.details).map(
        (key) => ({
          label: selectedProductType.details![key],
          value: key,
        })
      );
    }
  }

  /**
   * Helper function to get the label for a given value from an options array.
   * @param options Array of DropdownOption.
   * @param value The value to find the label for.
   * @returns The label string or the value itself if not found.
   */
  getLabel(options: DropdownOption[], value: string): string {
    const found = options.find((option) => option.value === value);
    return found ? found.label : value;
  }

  /**
   * Handles form submission.
   * Logs all selected values.
   */
  onSubmit(): void {
    console.log('Buyer Inquiry Submitted!');
    console.log(
      'Main Category:',
      this.getLabel(this.mainCategories, this.selectedMainCategory)
    );
    console.log(
      'Sub-Category:',
      this.getLabel(this.subCategories, this.selectedSubCategory)
    );
    console.log(
      'Product Type:',
      this.getLabel(this.productTypes, this.selectedProductType)
    );
    console.log(
      'Details:',
      this.getLabel(this.detailsOptions, this.selectedDetails)
    );

    // In a real application, you would send this data to a backend.
    alert('Your buyer inquiry has been submitted! Check console for details.');
    this.resetForm();
  }

  /**
   * Resets all form selections.
   */
  resetForm(): void {
    this.selectedMainCategory = '';
    this.selectedSubCategory = '';
    this.selectedProductType = '';
    this.selectedDetails = '';
    this.subCategories = [];
    this.productTypes = [];
    this.detailsOptions = [];
  }
}
