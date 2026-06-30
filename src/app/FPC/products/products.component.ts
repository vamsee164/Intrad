import { Component, OnInit, OnDestroy, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, User } from '../../services/auth.service';
import { TranslatePipe } from '../../shared/translate.pipe';

declare var bootstrap: any;

interface ProductItem {
  id: number;
  name: string;
  category: 'fruits' | 'vegetables' | 'herbs' | 'flowers';
  images: {
    fresh: string;
    slice: string;
    granule: string;
  };
  activeState: 'fresh' | 'slice' | 'granule';
  description: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  currentUser: User | null = null;
  isLoggedIn = false;

  selectedCategory = 'all';
  searchQuery = '';

  selectedProduct: ProductItem | null = null;
  orderData = {
    quantity: '',
    unit: 'kg',
    form: 'fresh',
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    notes: ''
  };

  successTitle = '';
  successMessage = '';

  @ViewChild('orderForm') orderForm!: NgForm;

  readonly categories = [
    { code: 'all',        labelKey: 'products.category.all' },
    { code: 'fruits',     labelKey: 'products.category.fruits' },
    { code: 'vegetables', labelKey: 'products.category.vegetables' },
    { code: 'herbs',      labelKey: 'products.category.herbs' },
    { code: 'flowers',    labelKey: 'products.category.flowers' }
  ];

  // All 42 products — 100% local assets, dedicated images per product
  products: ProductItem[] = [

    // ─── FRUITS (7) ───────────────────────────────────────────────────────────
    {
      id: 1, name: 'Mangoes', category: 'fruits',
      images: {
        fresh:   'assets/images/mango_fresh.png',
        slice:   'assets/images/mango_slice.png',
        granule: 'assets/images/mango_granule.png'
      },
      activeState: 'fresh',
      description: 'Sweet, tropical premium mangoes — ideal for slices and sweet fruit granules.'
    },
    {
      id: 2, name: 'Papayas', category: 'fruits',
      images: {
        fresh:   'assets/images/papaya_fresh.png',
        slice:   'assets/images/papaya_slice.png',
        granule: 'assets/images/papaya_granule.png'
      },
      activeState: 'fresh',
      description: 'Nutrient-rich papayas, freeze-dried to retain high vitamin content.'
    },
    {
      id: 3, name: 'Banana', category: 'fruits',
      images: {
        fresh:   'assets/images/banana_fresh.png',
        slice:   'assets/images/fruit_slice.png',
        granule: 'assets/images/fruit_granule.png'
      },
      activeState: 'fresh',
      description: 'Potassium-rich sweet bananas, processed into crispy freeze-dried coins.'
    },
    {
      id: 4, name: 'Guava', category: 'fruits',
      images: {
        fresh:   'assets/images/guava_fresh.png',
        slice:   'assets/images/fruit_slice.png',
        granule: 'assets/images/fruit_granule.png'
      },
      activeState: 'fresh',
      description: 'Flavorful pink and white guavas, loaded with vitamin C.'
    },
    {
      id: 5, name: 'Pineapple', category: 'fruits',
      images: {
        fresh:   'assets/images/pineapple_fresh.png',
        slice:   'assets/images/fruit_slice.png',
        granule: 'assets/images/fruit_granule.png'
      },
      activeState: 'fresh',
      description: 'Tangy-sweet tropical pineapples, perfect for snacks and powder applications.'
    },
    {
      id: 6, name: 'Jack Fruit', category: 'fruits',
      images: {
        fresh:   'assets/images/jackfruit_fresh.png',
        slice:   'assets/images/fruit_slice.png',
        granule: 'assets/images/fruit_granule.png'
      },
      activeState: 'fresh',
      description: 'Fibrous and sweet jackfruit, processed into crunchy, high-energy chips.'
    },
    {
      id: 7, name: 'Amla (Indian Gooseberry)', category: 'fruits',
      images: {
        fresh:   'assets/images/amla_fresh.png',
        slice:   'assets/images/fruit_slice.png',
        granule: 'assets/images/fruit_granule.png'
      },
      activeState: 'fresh',
      description: 'Superfood Indian gooseberry, dried and powdered for health supplements.'
    },

    // ─── VEGETABLES (18) ──────────────────────────────────────────────────────
    {
      id: 8, name: 'Tomatoes', category: 'vegetables',
      images: {
        fresh:   'assets/images/tomato_fresh.png',
        slice:   'assets/images/tomato_slice.png',
        granule: 'assets/images/tomato_granule.png'
      },
      activeState: 'fresh',
      description: 'Plump red tomatoes, freeze-dried for culinary powders and flakes.'
    },
    {
      id: 9, name: 'Onion', category: 'vegetables',
      images: {
        fresh:   'assets/images/onion_fresh.png',
        slice:   'assets/images/onion_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Savory red and white onions, processed into rings, flakes, and granulated seasoning.'
    },
    {
      id: 10, name: 'Sweet Corn', category: 'vegetables',
      images: {
        fresh:   'assets/images/sweetcorn_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Crisp, sweet golden corn kernels, processed to lock in fresh moisture.'
    },
    {
      id: 11, name: 'Spring Onion', category: 'vegetables',
      images: {
        fresh:   'assets/images/springonion_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Fresh spring scallion leaves, dehydrated for seasoning and instant noodles.'
    },
    {
      id: 12, name: 'Garlic', category: 'vegetables',
      images: {
        fresh:   'assets/images/garlic_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Pungent premium garlic cloves, processed into sliced chips and fine powder.'
    },
    {
      id: 13, name: 'Green Peas', category: 'vegetables',
      images: {
        fresh:   'assets/images/greenpeas_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Sweet tender green peas, freeze-dried for ready-to-eat meals.'
    },
    {
      id: 14, name: 'Beans', category: 'vegetables',
      images: {
        fresh:   'assets/images/beans_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Tender French beans, cut and freeze-dried to preserve bright green color.'
    },
    {
      id: 15, name: 'Bell Pepper (Capsicum)', category: 'vegetables',
      images: {
        fresh:   'assets/images/bellpepper_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Colorful red and green bell peppers, dried in dices and granules.'
    },
    {
      id: 16, name: 'Mushrooms', category: 'vegetables',
      images: {
        fresh:   'assets/images/mushrooms_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Earth-fresh white button mushrooms, sliced and freeze-dried for soups.'
    },
    {
      id: 17, name: 'Cabbage', category: 'vegetables',
      images: {
        fresh:   'assets/images/cabbage_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Crisp green cabbage flakes, perfect for noodles, soups, and mixes.'
    },
    {
      id: 18, name: 'Drumsticks', category: 'vegetables',
      images: {
        fresh:   'assets/images/drumsticks_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Healthy green drumstick pods, cut and processed for sambar and curries.'
    },
    {
      id: 19, name: 'Potatoes', category: 'vegetables',
      images: {
        fresh:   'assets/images/Potato.jpg',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'High-starch farm potatoes, processed into slices and dehydrated powder.'
    },
    {
      id: 20, name: 'Bitter Gourd', category: 'vegetables',
      images: {
        fresh:   'assets/images/bittergourd_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Nutritious bitter gourds, sliced and dehydrated for dietary health uses.'
    },
    {
      id: 21, name: 'Okra (Ladyfinger)', category: 'vegetables',
      images: {
        fresh:   'assets/images/okra_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Tender green ladies fingers, freeze-dried into crunchy snackable slices.'
    },
    {
      id: 22, name: 'Beetroot', category: 'vegetables',
      images: {
        fresh:   'assets/images/beetroot_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Crimson red beetroots, processed into sweet dried slices and fine red powder.'
    },
    {
      id: 23, name: 'Carrot', category: 'vegetables',
      images: {
        fresh:   'assets/images/Carrot.jpg',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Sweet beta-carotene rich carrots, sliced and granulated for baby foods.'
    },
    {
      id: 24, name: 'Ginger', category: 'vegetables',
      images: {
        fresh:   'assets/images/ginger_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Spicy farm-fresh ginger, processed into dried flakes and aromatic powder.'
    },
    {
      id: 25, name: 'Chillies', category: 'vegetables',
      images: {
        fresh:   'assets/images/chillies_fresh.png',
        slice:   'assets/images/vegetable_slice.png',
        granule: 'assets/images/vegetable_granule.png'
      },
      activeState: 'fresh',
      description: 'Fiery green and red chillies, dried and chopped for spice blends.'
    },

    // ─── HERBS & LEAVES (13) ──────────────────────────────────────────────────
    {
      id: 26, name: 'Fenugreek Leaves (Methi)', category: 'herbs',
      images: {
        fresh:   'assets/images/fenugreek_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Aromatic green fenugreek leaves, dried cleanly for culinary flavoring.'
    },
    {
      id: 27, name: 'Spinach', category: 'herbs',
      images: {
        fresh:   'assets/images/Spinach.jpg',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Leafy green iron-rich spinach, freeze-dried to preserve color and nutrients.'
    },
    {
      id: 28, name: 'Coriander Leaves', category: 'herbs',
      images: {
        fresh:   'assets/images/coriander_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Fragrant coriander greens, dehydrated for garnishing ready meals.'
    },
    {
      id: 29, name: 'Kasturi Methi', category: 'herbs',
      images: {
        fresh:   'assets/images/fenugreek_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Premium dried fenugreek leaves, highly prized for butter-gravy enhancements.'
    },
    {
      id: 30, name: 'Tulsi (Holy Basil)', category: 'herbs',
      images: {
        fresh:   'assets/images/tulsi_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Medicinal holy basil leaves, dried carefully for herbal teas and health.'
    },
    {
      id: 31, name: 'Basil Leaves', category: 'herbs',
      images: {
        fresh:   'assets/images/basil_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Sweet Italian basil, dehydrated for pizzas, pastas, and pesto mixes.'
    },
    {
      id: 32, name: 'Lemon Grass', category: 'herbs',
      images: {
        fresh:   'assets/images/lemongrass_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Citrusy lemongrass stalks, dried for teas, infusions, and Thai cuisine.'
    },
    {
      id: 33, name: 'Wheat Grass', category: 'herbs',
      images: {
        fresh:   'assets/images/wheatgrass_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Nutritious young wheat grass shoots, processed into a vibrant green health powder.'
    },
    {
      id: 34, name: 'Moringa Leaves', category: 'herbs',
      images: {
        fresh:   'assets/images/moringa_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Nutrient-dense moringa drumstick leaves, dried for daily dietary vitamins.'
    },
    {
      id: 35, name: 'Neem Leaves', category: 'herbs',
      images: {
        fresh:   'assets/images/basil_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Bitter medicinal neem leaves, processed for therapeutic and skincare powders.'
    },
    {
      id: 36, name: 'Mint Leaves', category: 'herbs',
      images: {
        fresh:   'assets/images/coriander_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Refreshing cool mint leaves, dried for beverages and seasoning blends.'
    },
    {
      id: 37, name: 'Curry Leaves', category: 'herbs',
      images: {
        fresh:   'assets/images/tulsi_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Aromatic curry leaves, essential in Indian cooking, dried to retain oils.'
    },
    {
      id: 38, name: 'Methi Leaves (Alternative)', category: 'herbs',
      images: {
        fresh:   'assets/images/fenugreek_fresh.png',
        slice:   'assets/images/herb_slice.png',
        granule: 'assets/images/herb_granule.png'
      },
      activeState: 'fresh',
      description: 'Traditional fresh fenugreek greens, dried for local culinary dishes.'
    },

    // ─── FLOWERS (4) ──────────────────────────────────────────────────────────
    {
      id: 39, name: 'Rose Petals', category: 'flowers',
      images: {
        fresh:   'assets/images/flower_slice.png',
        slice:   'assets/images/flower_slice.png',
        granule: 'assets/images/flower_granule.png'
      },
      activeState: 'fresh',
      description: 'Delicate red rose petals, dried for cosmetics, garnishes, and sweet syrups.'
    },
    {
      id: 40, name: 'Rose Buds', category: 'flowers',
      images: {
        fresh:   'assets/images/flower_slice.png',
        slice:   'assets/images/flower_slice.png',
        granule: 'assets/images/flower_granule.png'
      },
      activeState: 'fresh',
      description: 'Whole miniature rose buds, carefully dried for tea infusions and potpourri.'
    },
    {
      id: 41, name: 'Marigold', category: 'flowers',
      images: {
        fresh:   'assets/images/flower_slice.png',
        slice:   'assets/images/flower_slice.png',
        granule: 'assets/images/flower_granule.png'
      },
      activeState: 'fresh',
      description: 'Vibrant orange marigold blossoms, dried for dyes, teas, and herbal remedies.'
    },
    {
      id: 42, name: 'Jasmine', category: 'flowers',
      images: {
        fresh:   'assets/images/flower_slice.png',
        slice:   'assets/images/flower_slice.png',
        granule: 'assets/images/flower_granule.png'
      },
      activeState: 'fresh',
      description: 'Sweetly scented jasmine flowers, processed for perfume bases and aromatic green teas.'
    }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.isLoggedIn = !!user;
        },
        error: (error) => {
          console.error('Error fetching auth state in ProductsComponent:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredProducts(): ProductItem[] {
    let result = this.products;
    if (this.selectedCategory !== 'all') {
      result = result.filter(p => p.category === this.selectedCategory);
    }
    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      );
    }
    return result;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  setProductState(product: ProductItem, state: 'fresh' | 'slice' | 'granule'): void {
    product.activeState = state;
  }

  onImageError(event: Event): void {
    const imgEl = event.target as HTMLImageElement;
    if (imgEl.dataset['fallback'] !== 'true') {
      imgEl.dataset['fallback'] = 'true';
      imgEl.src = 'assets/images/agri.png';
    }
  }

  openOrderInquiry(product: ProductItem): void {
    this.selectedProduct = product;
    this.orderData = {
      quantity: '',
      unit: 'kg',
      form: 'slice',
      guestName:  this.currentUser?.name  || '',
      guestPhone: this.currentUser?.phone || '',
      guestEmail: this.currentUser?.email || '',
      notes: ''
    };
    this.showModal('orderModal');
  }

  submitOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.form.markAllAsTouched();
      return;
    }

    const payload = {
      productId:   this.selectedProduct?.id,
      productName: this.selectedProduct?.name,
      inquiryDate: new Date().toISOString(),
      order: { ...this.orderData },
      user: this.isLoggedIn ? {
        uid:   this.currentUser?.id,
        name:  this.currentUser?.name,
        email: this.currentUser?.email,
        phone: this.currentUser?.phone
      } : {
        name:  this.orderData.guestName,
        email: this.orderData.guestEmail,
        phone: this.orderData.guestPhone
      }
    };

    console.log('Product Order Inquiry submitted:', JSON.stringify(payload, null, 2));

    this.successTitle   = 'Inquiry Submitted';
    this.successMessage = `Your wholesale inquiry for ${this.orderData.quantity} ${this.orderData.unit} of ${this.selectedProduct?.name} (${this.orderData.form}) has been received. We will send a quotation shortly.`;

    this.hideModal('orderModal');
    this.showModal('successModalProducts');

    if (this.orderForm) {
      this.orderForm.resetForm();
    }
  }

  navigateToHome(): void {
    this.router.navigate(['/homepage']);
  }

  private showModal(id: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const el = document.getElementById(id);
        if (el) {
          const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
          modal.show();
        }
      } catch (err) {
        console.error(`Error displaying modal ${id}:`, err);
      }
    }
  }

  private hideModal(id: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const el = document.getElementById(id);
        if (el) {
          const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
          modal.hide();
        }
      } catch (err) {
        console.error(`Error hiding modal ${id}:`, err);
      }
    }
  }

  trackByFn(index: number, item: any): any {
    return item?.id || item?.code || index;
  }
}
