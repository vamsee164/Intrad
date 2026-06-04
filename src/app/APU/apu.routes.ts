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
    canActivate: [AuthGuard]           // Fix #4: was public, now requires login
  },
  {
    path: 'seller',
    component: SellerComponent,
    canActivate: [AuthGuard, RoleGuard], // Fix #7: added RoleGuard for seller role
    data: { role: 'seller' }
  }
];