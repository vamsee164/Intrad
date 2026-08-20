import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, map, switchMap } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';

export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  phone?: string;
  location?: string;
  profileData?: any;
}

interface LoginCredentials {
  email: string;
  password: string;
  csrfToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  public readonly currentUser$ = this.currentUserSubject.asObservable();
  private sessionTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly router: Router,
    private readonly firebaseService: FirebaseService
  ) {
    this.checkAuthStatus();
  }

  login(credentials: LoginCredentials): Observable<boolean> {
    return this.firebaseService.findUserByIdentifier(credentials.email).pipe(
      map((user) => user?.email || user?.personalEmail || credentials.email),
      catchError(() => of(credentials.email)),
      switchMap((targetEmail) => {
        return this.firebaseService.loginWithEmailPassword(targetEmail, credentials.password).pipe(
          switchMap((authResult) => {
            const uid = authResult.user.uid;
            return this.firebaseService.getUser(uid).pipe(
              map((profile) => {
                if (!profile) return false;
                const userLocation = profile.village
                  ? (profile.mandal ? `${profile.village}, ${profile.mandal}` : profile.village)
                  : (profile.location || profile.address || '');
                const user: User = {
                  id: uid,
                  email: profile.personalEmail || profile.email || credentials.email,
                  role: profile.role || 'farmer',
                  name: profile.name || '',
                  phone: profile.mobileNo || profile.phone || '',
                  location: userLocation,
                  profileData: profile
                };
                this.setCurrentUser(user);
                this.startSessionTimeout();
                return true;
              }),
              catchError(() => of(false))
            );
          }),
          catchError((authError) => {
            console.warn('Firebase Auth failed, trying database fallback:', authError.message);
            return this.firebaseService.getAllUsers().pipe(
              map((users) => {
                if (!users) return false;
                for (const uid in users) {
                  const userObj = users[uid];
                  if (
                    userObj &&
                    (userObj.email === credentials.email ||
                      userObj.personalEmail === credentials.email ||
                      userObj.mobileNo === credentials.email ||
                      userObj.phone === credentials.email) &&
                    userObj.password === credentials.password
                  ) {
                    const legacyLocation = userObj.village
                      ? (userObj.mandal ? `${userObj.village}, ${userObj.mandal}` : userObj.village)
                      : (userObj.location || userObj.address || '');
                    const legacyUser: User = {
                      id: userObj.userId || uid,
                      email: userObj.personalEmail || userObj.email || credentials.email,
                      role: userObj.role || 'farmer',
                      name: userObj.name || '',
                      phone: userObj.mobileNo || userObj.phone || '',
                      location: legacyLocation,
                      profileData: userObj
                    };
                    this.setCurrentUser(legacyUser);
                    this.startSessionTimeout();
                    return true;
                  }
                }
                return false;
              }),
              catchError(() => of(false))
            );
          })
        );
      })
    );
  }

  validateFirebaseUser(email: string, password: string, firebaseUsers: any): User | null {
    try {
      if (!firebaseUsers) return null;
      
      for (const userId in firebaseUsers) {
        const userContainer = firebaseUsers[userId];
        for (const firebaseKey in userContainer) {
          const user = userContainer[firebaseKey];
          if (user?.email === email && user?.password === password) {
            // Extract phone number from multiple possible fields
            const phoneNumber = user.phone || user.phoneNumber || user.mobileNo || user.mobile || '';
            
            return { 
              id: user.userId || userId, 
              email: user.email, 
              role: user.role || 'farmer',
              name: user.name || (user.firstName ? user.firstName + ' ' + (user.lastName || '') : ''),
              phone: phoneNumber,
              location: user.location || user.address || user.village || '',
              profileData: user
            };
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Firebase user validation error:', error);
      return null;
    }
  }

  /** @deprecated — use validateFirebaseUser() for real user lookup */
  private validateUser({ email, password }: LoginCredentials): User | null {
    // Removed hardcoded credentials — authentication is done via Firebase
    return null;
  }

  setCurrentUser(user: User): void {
    try {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      this.currentUserSubject.next(user);
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  }

  logout(redirectTo: string = '/homepage'): void {
    try {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
      }
      this.clearSessionTimeout();
      this.currentUserSubject.next(null);
      
      // Navigate to the specified route after logout
      this.router.navigate([redirectTo]);
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback navigation on error
      this.router.navigate(['/homepage']);
    }
  }

  /**
   * Get the appropriate dashboard route based on user role
   */
  getDashboardRoute(role?: string): string {
    const userRole = role || this.currentUserSubject.value?.role;
    switch (userRole) {
      case 'admin':
        return '/control';
      case 'farmer':
        return '/farmer';
      case 'buyer':
      case 'user': // Legacy fallback
        return '/apu/buyer';
      case 'seller':
        return '/apu/seller';
      default:
        return '/homepage';
    }
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.role === role;
  }

  sendPasswordResetEmail(email: string): Observable<boolean> {
    return this.firebaseService.sendPasswordResetEmail(email).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error sending password reset email via Firebase Auth:', error);
        return of(false);
      })
    );
  }

  private checkAuthStatus(): void {
    try {
      if (isPlatformBrowser(this.platformId)) {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          const user = JSON.parse(userData);
          this.currentUserSubject.next(user);
          this.startSessionTimeout();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  private startSessionTimeout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.clearSessionTimeout();
    this.sessionTimeout = setTimeout(() => {
      this.logout('/homepage');
    }, 30 * 60 * 1000); // 30 minutes
  }

  private clearSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }
}