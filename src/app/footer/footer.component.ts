import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
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

  navigateToCareer(): void {
    this.router.navigate(['/career']);
  }

  navigateToContact(): void {
    this.router.navigate(['/contact']);
  }
}
