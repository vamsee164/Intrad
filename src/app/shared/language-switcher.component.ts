import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dropdown">
      <button class="btn btn-outline-primary-green btn-sm dropdown-toggle" type="button" 
              data-bs-toggle="dropdown" aria-expanded="false">
        <i class="fas fa-globe me-1"></i>
        {{ getCurrentLanguageName() }}
      </button>
      <ul class="dropdown-menu">
        <li *ngFor="let lang of languages">
          <a class="dropdown-item" 
             [class.active]="lang.code === currentLanguage"
             (click)="switchLanguage(lang.code)"
             style="cursor: pointer;">
            {{ lang.nativeName }}
          </a>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .dropdown-item.active {
      background-color: var(--primary-green);
      color: white;
    }
  `]
})
export class LanguageSwitcherComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  languages: { code: string; name: string; nativeName: string }[] = [];
  currentLanguage = 'en';

  constructor(private translationService: TranslationService) {
    this.languages = this.translationService.getAvailableLanguages();
    this.currentLanguage = this.translationService.getCurrentLanguage();
    this.translationService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLanguage = lang;
      });
  }

  switchLanguage(langCode: string): void {
    this.translationService.setLanguage(langCode);
  }

  getCurrentLanguageName(): string {
    const lang = this.languages.find(l => l.code === this.currentLanguage);
    return lang?.nativeName || 'English';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}