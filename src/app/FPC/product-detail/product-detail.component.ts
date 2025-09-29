import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent implements OnInit {
  product: any;
  products = [
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

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.product = this.getProductById(id);
  }

  // ✅ ProductService logic implemented here
  getProductById(id: number) {
    return this.products.find((p) => p.id === id);
  }

  getProductsByCategory(category: string) {
    return this.products.filter((p) => p.category === category);
  }
}
