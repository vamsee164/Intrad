import { Routes } from '@angular/router';
import { HomepageComponent } from './FPC/Homepage/homepage.component';
import { CareerComponent } from './FPC/career/career.component';
import { BookSoilComponent } from './FPC/book-soil/book-soil.component';
import { AboutUsComponent } from './FPC/about-us/about-us.component';
import { ContactUsComponent } from './FPC/contact-us/contact-us.component';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'career', component: CareerComponent },
  { path: 'booksoil', component: BookSoilComponent },
  { path: 'about', component: AboutUsComponent },
  { path: 'contact', component: ContactUsComponent },
];
