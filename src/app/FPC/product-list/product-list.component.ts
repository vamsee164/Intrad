import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

const products = [
  // Fruits
  {
    id: 1,
    category: 'fruits',
    name: 'Banana',
    description: 'Sweet and ripe farm-fresh bananas',
    image: 'assets/images/banana_fresh.png',
  },
  {
    id: 2,
    category: 'fruits',
    name: 'Mango',
    description: 'Delicious and tropical alphonso mangoes',
    image: 'assets/images/mango_fresh.png',
  },
  {
    id: 3,
    category: 'fruits',
    name: 'Papaya',
    description: 'Naturally sweet and vitamin-rich papaya',
    image: 'assets/images/papaya_fresh.png',
  },
  {
    id: 4,
    category: 'fruits',
    name: 'Guava',
    description: 'Fresh and crunchy guavas packed with vitamin C',
    image: 'assets/images/guava_fresh.png',
  },
  {
    id: 5,
    category: 'fruits',
    name: 'Pineapple',
    description: 'Juicy and tangy farm-fresh pineapples',
    image: 'assets/images/pineapple_fresh.png',
  },
  {
    id: 6,
    category: 'fruits',
    name: 'Jackfruit',
    description: 'Large and flavourful tropical jackfruit',
    image: 'assets/images/jackfruit_fresh.png',
  },
  {
    id: 7,
    category: 'fruits',
    name: 'Amla',
    description: 'Immunity-boosting Indian gooseberry',
    image: 'assets/images/amla_fresh.png',
  },
  {
    id: 8,
    category: 'fruits',
    name: 'Orange',
    description: 'Citrus-rich and refreshing oranges',
    image: 'assets/images/Orange.jpg',
  },
  {
    id: 9,
    category: 'fruits',
    name: 'Grapes',
    description: 'Seedless and sweet green grapes',
    image: 'assets/images/Grapes.jpg',
  },

  // Vegetables
  {
    id: 10,
    category: 'vegetables',
    name: 'Tomato',
    description: 'Red and juicy farm-fresh tomatoes',
    image: 'assets/images/tomato_fresh.png',
  },
  {
    id: 11,
    category: 'vegetables',
    name: 'Onion',
    description: 'Pungent and flavourful farm-fresh onions',
    image: 'assets/images/onion_fresh.png',
  },
  {
    id: 12,
    category: 'vegetables',
    name: 'Potato',
    description: 'Versatile and farm-fresh potatoes',
    image: 'assets/images/Potato.jpg',
  },
  {
    id: 13,
    category: 'vegetables',
    name: 'Carrot',
    description: 'Crunchy and vitamin-rich carrots',
    image: 'assets/images/Carrot.jpg',
  },
  {
    id: 14,
    category: 'vegetables',
    name: 'Spinach',
    description: 'Leafy and iron-rich fresh spinach',
    image: 'assets/images/Spinach.jpg',
  },
  {
    id: 15,
    category: 'vegetables',
    name: 'Broccoli',
    description: 'Tender and nutritious green broccoli florets',
    image: 'assets/images/Broccoli.jpg',
  },
  {
    id: 16,
    category: 'vegetables',
    name: 'Okra',
    description: 'Tender and fresh lady finger / bhindi',
    image: 'assets/images/okra_fresh.png',
  },
  {
    id: 17,
    category: 'vegetables',
    name: 'Cabbage',
    description: 'Crisp and fresh green cabbage heads',
    image: 'assets/images/cabbage_fresh.png',
  },
  {
    id: 18,
    category: 'vegetables',
    name: 'Bitter Gourd',
    description: 'Fresh and healthy bitter gourd / karela',
    image: 'assets/images/bittergourd_fresh.png',
  },
  {
    id: 19,
    category: 'vegetables',
    name: 'Bell Pepper',
    description: 'Vibrant and crisp colourful bell peppers',
    image: 'assets/images/bellpepper_fresh.png',
  },
  {
    id: 20,
    category: 'vegetables',
    name: 'Beetroot',
    description: 'Earthy and nutrient-dense farm-fresh beetroot',
    image: 'assets/images/beetroot_fresh.png',
  },
  {
    id: 21,
    category: 'vegetables',
    name: 'Beans',
    description: 'Tender and protein-rich green beans',
    image: 'assets/images/beans_fresh.png',
  },
  {
    id: 22,
    category: 'vegetables',
    name: 'Green Peas',
    description: 'Sweet and fresh green peas pods',
    image: 'assets/images/greenpeas_fresh.png',
  },
  {
    id: 23,
    category: 'vegetables',
    name: 'Sweet Corn',
    description: 'Juicy and sweet farm-fresh corn cobs',
    image: 'assets/images/sweetcorn_fresh.png',
  },
  {
    id: 24,
    category: 'vegetables',
    name: 'Garlic',
    description: 'Aromatic and flavourful fresh garlic bulbs',
    image: 'assets/images/garlic_fresh.png',
  },
  {
    id: 25,
    category: 'vegetables',
    name: 'Ginger',
    description: 'Pungent and medicinal farm-fresh ginger',
    image: 'assets/images/ginger_fresh.png',
  },
  {
    id: 26,
    category: 'vegetables',
    name: 'Chillies',
    description: 'Spicy and fiery fresh green chillies',
    image: 'assets/images/chillies_fresh.png',
  },
  {
    id: 27,
    category: 'vegetables',
    name: 'Drumstick',
    description: 'Nutritious and tender drumstick / moringa pods',
    image: 'assets/images/drumsticks_fresh.png',
  },
  {
    id: 28,
    category: 'vegetables',
    name: 'Mushroom',
    description: 'Fresh and earthy button mushrooms',
    image: 'assets/images/mushrooms_fresh.png',
  },
  {
    id: 29,
    category: 'vegetables',
    name: 'Coriander',
    description: 'Fragrant and fresh coriander leaves',
    image: 'assets/images/coriander_fresh.png',
  },
  {
    id: 30,
    category: 'vegetables',
    name: 'Fenugreek',
    description: 'Healthy and aromatic fenugreek / methi leaves',
    image: 'assets/images/fenugreek_fresh.png',
  },
  {
    id: 31,
    category: 'vegetables',
    name: 'Spring Onion',
    description: 'Mild and fresh spring onion stalks',
    image: 'assets/images/springonion_fresh.png',
  },
];

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  category: string = '';
  products: any[] = [];
  selectedProduct: any = null;

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    // Subscribe to changes in the route params
    this.route.paramMap.subscribe((params) => {
      this.category = params.get('category') || '';
      console.log('Category changed:', this.category);
      this.products = this.getProductsByCategory(this.category);
    });
  }

  getProductsByCategory(category: string) {
    return products.filter((p) => p.category === category);
  }

  openAuthModal(product: any) {
    this.selectedProduct = product;
  }

  navigateToLogin() {
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 300);
  }

  navigateToGuest() {
    setTimeout(() => {
      this.router.navigate(['/apu/buyer']);
    }, 300);
  }

  trackByFn(index: number, item: any): any {
    return item?.id || index;
  }
}
