import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

const products = [
  // Fruits
  {
    id: 1,
    category: 'fruits',
    name: 'Apple',
    description: 'Fresh and juicy apples',
    price: 100,
    image: 'https://placehold.co/300x200?text=Apple',
  },
  {
    id: 2,
    category: 'fruits',
    name: 'Banana',
    description: 'Sweet and ripe bananas',
    price: 40,
    image: 'https://placehold.co/300x200?text=Banana',
  },
  {
    id: 3,
    category: 'fruits',
    name: 'Orange',
    description: 'Citrus-rich and refreshing oranges',
    price: 70,
    image: 'https://placehold.co/300x200?text=Orange',
  },
  {
    id: 4,
    category: 'fruits',
    name: 'Mango',
    description: 'Delicious tropical mangoes',
    price: 120,
    image: 'https://placehold.co/300x200?text=Mango',
  },
  {
    id: 5,
    category: 'fruits',
    name: 'Grapes',
    description: 'Seedless and sweet green grapes',
    price: 90,
    image: 'https://placehold.co/300x200?text=Grapes',
  },

  // Vegetables
  {
    id: 6,
    category: 'vegetables',
    name: 'Carrot',
    description: 'Crunchy and vitamin-rich carrots',
    price: 60,
    image: 'https://placehold.co/300x200?text=Carrot',
  },
  {
    id: 7,
    category: 'vegetables',
    name: 'Broccoli',
    description: 'Fresh and green broccoli florets',
    price: 80,
    image: 'https://placehold.co/300x200?text=Broccoli',
  },
  {
    id: 8,
    category: 'vegetables',
    name: 'Tomato',
    description: 'Red and juicy farm-fresh tomatoes',
    price: 50,
    image: 'https://placehold.co/300x200?text=Tomato',
  },
  {
    id: 9,
    category: 'vegetables',
    name: 'Spinach',
    description: 'Leafy and iron-rich spinach',
    price: 40,
    image: 'https://placehold.co/300x200?text=Spinach',
  },
  {
    id: 10,
    category: 'vegetables',
    name: 'Potato',
    description: 'Versatile and fresh potatoes',
    price: 30,
    image: 'https://placehold.co/300x200?text=Potato',
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

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // ✅ Subscribe to changes in the route params
    this.route.paramMap.subscribe((params) => {
      this.category = params.get('category') || '';
      console.log('Category changed:', this.category);
      this.products = this.getProductsByCategory(this.category);
    });
  }

  getProductsByCategory(category: string) {
    return products.filter((p) => p.category === category);
  }
}
