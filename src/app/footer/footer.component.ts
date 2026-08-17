import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  constructor(private router: Router) {}

  navigateTo(url: string): void {
    this.router.navigate([url]).then(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }
}
