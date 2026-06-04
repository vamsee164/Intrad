import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

const products = [
  // Fruits
  {
    id: 1,
    category: 'fruits',
    name: 'Apple',
    description: 'Fresh and juicy apples',
    price: 100,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 2,
    category: 'fruits',
    name: 'Banana',
    description: 'Sweet and ripe bananas',
    price: 40,
    image: 'https://images.unsplash.com/photo-1571501435323-b1d55f0b83e0?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 3,
    category: 'fruits',
    name: 'Orange',
    description: 'Citrus-rich and refreshing oranges',
    price: 70,
    image: 'https://images.unsplash.com/photo-1549888834-3ec93abae044?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 4,
    category: 'fruits',
    name: 'Mango',
    description: 'Delicious tropical mangoes',
    price: 120,
    image: 'https://images.unsplash.com/photo-1553279768-865429fd01a5?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 5,
    category: 'fruits',
    name: 'Grapes',
    description: 'Seedless and sweet green grapes',
    price: 90,
    image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=400&q=80',
  },

  // Vegetables
  {
    id: 6,
    category: 'vegetables',
    name: 'Carrot',
    description: 'Crunchy and vitamin-rich carrots',
    price: 60,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 7,
    category: 'vegetables',
    name: 'Broccoli',
    description: 'Fresh and green broccoli florets',
    price: 80,
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 8,
    category: 'vegetables',
    name: 'Tomato',
    description: 'Red and juicy farm-fresh tomatoes',
    price: 50,
    image: 'assets/images/tomato.png',
  },
  {
    id: 9,
    category: 'vegetables',
    name: 'Spinach',
    description: 'Leafy and iron-rich spinach',
    price: 40,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 10,
    category: 'vegetables',
    name: 'Potato',
    description: 'Versatile and fresh potatoes',
    price: 30,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80',
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

  constructor(private route: ActivatedRoute, private router: Router) {}

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
