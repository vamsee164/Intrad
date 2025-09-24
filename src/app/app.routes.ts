import { Routes } from '@angular/router';
import { HomepageComponent } from './FPC/Homepage/homepage.component';
import { CareerComponent } from './FPC/career/career.component';
import { BookSoilComponent } from './FPC/book-soil/book-soil.component';
import { AboutUsComponent } from './FPC/about-us/about-us.component';
import { ContactUsComponent } from './FPC/contact-us/contact-us.component';
import { LoginComponent } from './FPC/login/login.component';
import { BuyerComponent } from './APU/buyer/buyer.component';
import { SellerComponent } from './APU/seller/seller.component';
import { AppControlComponent } from './app-control/app-control.component';
import { UserDashboardComponent } from './dashboards/user-dashboard.component';
import { FarmerDashboardComponent } from './dashboards/farmer-dashboard.component';
import { AdminDashboardComponent } from './dashboards/admin-dashboard.component';
import { VegetablesComponent } from './FPC/vegetables/vegetables.component';
import { FruitsComponent } from './FPC/fruits/fruits.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'control', component: AdminDashboardComponent, canActivate: [RoleGuard], data: { role: 'admin' } },
  { path: 'homepage', component: HomepageComponent },
  { path: 'career', component: CareerComponent },
  { path: 'booksoil', component: BookSoilComponent },
  { path: 'about', component: AboutUsComponent },
  { path: 'contact', component: ContactUsComponent },
  { path: 'crops/vegetables', component: VegetablesComponent },
  { path: 'crops/fruits', component: FruitsComponent },
  { path: 'buyer', component: UserDashboardComponent, canActivate: [RoleGuard], data: { role: 'user' } },
  { path: 'seller', component: FarmerDashboardComponent, canActivate: [RoleGuard], data: { role: 'farmer' } }
];
