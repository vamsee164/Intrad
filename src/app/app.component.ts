import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomepageComponent } from './FPC/homepage/homepage.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { BuyerComponent } from './NewFolder/buyer/buyer.component';
import { SellerComponent } from './NewFolder/seller/seller.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    BuyerComponent,
    HomepageComponent,
    NavbarComponent,
    FooterComponent,
    SellerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'intrad';
}
