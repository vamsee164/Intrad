import { Routes } from '@angular/router';
import { HomepageComponent } from './FPC/homepage/homepage.component';
import { CareerComponent } from './FPC/career/career.component';
import { BookSoilComponent } from './FPC/book-soil/book-soil.component';
import { AboutUsComponent } from './FPC/about-us/about-us.component';
import { ContactUsComponent } from './FPC/contact-us/contact-us.component';
import { LoginComponent } from './FPC/login/login.component';
import { BuyerComponent } from './APU/buyer/buyer.component';
import { SellerComponent } from './APU/seller/seller.component';
import { AppControlComponent } from './app-control/app-control.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'control', component: AppControlComponent, canActivate: [AuthGuard] },
  { path: 'homepage', component: HomepageComponent },
  { path: 'career', component: CareerComponent },
  { path: 'booksoil', component: BookSoilComponent },
  { path: 'about', component: AboutUsComponent },
  { path: 'contact', component: ContactUsComponent },
  { path: 'buyer', component: BuyerComponent, canActivate: [AuthGuard] },
  { path: 'seller', component: SellerComponent, canActivate: [AuthGuard] }
];
