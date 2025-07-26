import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'farmer' | 'user';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  login(email: string, password: string): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        const mockUsers = [
          { email: 'admin@test.com', password: 'admin123', role: 'admin' as const },
          { email: 'farmer@test.com', password: 'farmer123', role: 'farmer' as const },
          { email: 'user@test.com', password: 'pass', role: 'user' as const }
        ];

        const user = mockUsers.find(u => u.email === email && u.password === password);
        
        if (user) {
          const authUser: User = { id: Date.now().toString(), email: user.email, role: user.role };
          this.currentUserSubject.next(authUser);
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 500);
    });
  }

  logout(): void {
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }




}