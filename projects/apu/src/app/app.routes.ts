import { Routes } from '@angular/router';
import { BuyerComponent } from './APU/buyer/buyer.component';
import { SellerComponent } from './APU/seller/seller.component';

export const routes: Routes = [
  { path: '', redirectTo: '/buyer', pathMatch: 'full' },
  { path: 'buyer', component: BuyerComponent },
  { path: 'seller', component: SellerComponent }
];