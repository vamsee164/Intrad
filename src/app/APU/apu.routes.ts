import { Routes } from '@angular/router';
import { BuyerComponent } from './buyer/buyer.component';
import { SellerComponent } from './seller/seller.component';
import { AuthGuard } from '../guards/auth.guard';
import { RoleGuard } from '../guards/role.guard';

export const APU_ROUTES: Routes = [
  { path: '', redirectTo: 'buyer', pathMatch: 'full' },
  {
    path: 'buyer',
    component: BuyerComponent,
    canActivate: [AuthGuard, RoleGuard],  // Only buyers (and admins) can access buyer portal
    data: { role: 'buyer' }
  },
  {
    path: 'seller',
    component: SellerComponent,
    canActivate: [AuthGuard, RoleGuard],  // Only sellers (and admins) can access seller portal
    data: { role: 'seller' }
  }
];