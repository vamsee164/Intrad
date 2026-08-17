import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'homepage', pathMatch: 'full' },
  {
    path: 'homepage',
    loadComponent: () => import('./FPC/Homepage/homepage.component').then(m => m.HomepageComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./FPC/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'career',
    loadComponent: () => import('./FPC/career/career.component').then(m => m.CareerComponent)
  },
  {
    path: 'booksoil',
    loadComponent: () => import('./FPC/book-soil/book-soil.component').then(m => m.BookSoilComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./FPC/about-us/about-us.component').then(m => m.AboutUsComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./FPC/contact-us/contact-us.component').then(m => m.ContactUsComponent)
  },
  {
    path: 'machinery',
    loadComponent: () => import('./FPC/machinery/machinery.component').then(m => m.MachineryComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./FPC/products/products.component').then(m => m.ProductsComponent)
  },
  {
    path: 'crops/:category',
    loadComponent: () => import('./FPC/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./FPC/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'control',
    loadComponent: () => import('./app-control/app-control.component').then(m => m.AppControlComponent),
    canActivate: [RoleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'buyer',
    loadComponent: () => import('./dashboards/user-dashboard.component').then(m => m.UserDashboardComponent),
    canActivate: [RoleGuard],
    data: { role: 'buyer' }  // Fixed: was 'user', signup creates role='buyer'
  },
  {
    path: 'apu',
    loadChildren: () => import('./APU/apu.routes').then(m => m.APU_ROUTES)
  },
  {
    path: 'farmer',
    loadComponent: () => import('./dashboards/farmer-dashboard/farmer-dashboard.component').then(m => m.FarmerDashboardComponent),
    canActivate: [RoleGuard],
    data: { role: 'farmer' }
  },
  {
    path: 'report',
    loadComponent: () => import('./report/report.component').then(m => m.ReportComponent),
    canActivate: [RoleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'profile',
    loadComponent: () => import('./user-profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '404',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  { path: '**', redirectTo: '404' }
];
