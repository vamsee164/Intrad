import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface User {
  id: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.checkAuthStatus();
  }

  login(email: string, password: string): Observable<boolean> {
    const user = this.validateUser(email, password);
    if (user) {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      this.currentUserSubject.next(user);
      return of(true);
    }
    return of(false);
  }

  private validateUser(email: string, password: string): User | null {
    const users = [
      { id: '1', email: 'admin@intrad.com', password: 'admin123', role: 'admin' },
      { id: '2', email: 'farmer@intrad.com', password: 'farmer123', role: 'farmer' },
      { id: '3', email: 'user@intrad.com', password: 'user123', role: 'user' }
    ];
    
    const foundUser = users.find(u => u.email === email && u.password === password);
    return foundUser ? { id: foundUser.id, email: foundUser.email, role: foundUser.role } : null;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.role === role : false;
  }

  private checkAuthStatus(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      }
    }
  }
}