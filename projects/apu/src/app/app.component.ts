import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BuyerComponent } from './APU/buyer/buyer.component';
import { SellerComponent } from './APU/seller/seller.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BuyerComponent, SellerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'apu';
}
