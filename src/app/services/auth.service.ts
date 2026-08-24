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

  // Built-in demo accounts for local testing / backwards compatibility
  private static readonly DEMO_ACCOUNTS: Record<string, { role: string; name: string; password: string }> = {
    'admin@intrad.com': { role: 'admin', name: 'Intra-D Admin', password: 'admin123' },
    'farmer@intrad.com': { role: 'farmer', name: 'Demo Farmer', password: 'farmer123' },
    'user@intrad.com': { role: 'buyer', name: 'Demo Buyer', password: 'user123' },
    'buyer@intrad.com': { role: 'buyer', name: 'Demo Buyer', password: 'buyer123' },
    'seller@intrad.com': { role: 'seller', name: 'Demo Seller', password: 'seller123' }
  };

  login(credentials: LoginCredentials): Observable<boolean> {
    const inputIdentifier = (credentials.email || '').trim();
    const inputPassword = (credentials.password || '').trim();
    const cleanId = inputIdentifier.toLowerCase();

    return this.firebaseService.findUserByIdentifier(inputIdentifier).pipe(
      map((user) => user?.email || user?.personalEmail || user?.appGeneratedEmail || inputIdentifier),
      catchError(() => of(inputIdentifier)),
      switchMap((targetEmail) => {
        return this.firebaseService.loginWithEmailPassword(targetEmail, inputPassword).pipe(
          switchMap((authResult) => {
            const uid = authResult.user.uid;
            return this.firebaseService.getUser(uid).pipe(
              switchMap((profile) => {
                if (profile && (profile.name || profile.role || profile.email)) {
                  return of(profile);
                }
                // Fallback to findUserByIdentifier if profile wasn't at direct UID path
                return this.firebaseService.findUserByIdentifier(targetEmail);
              }),
              map((profile) => {
                const userLocation = profile?.village
                  ? (profile.mandal ? `${profile.village}, ${profile.mandal}` : profile.village)
                  : (profile?.location || profile?.address || '');
                const user: User = {
                  id: uid,
                  email: profile?.personalEmail || profile?.email || targetEmail,
                  role: profile?.role || 'farmer',
                  name: profile?.name || profile?.firstName || '',
                  phone: profile?.mobileNo || profile?.phone || profile?.phoneNumber || '',
                  location: userLocation,
                  profileData: profile || {}
                };
                this.setCurrentUser(user);
                this.startSessionTimeout();
                return true;
              }),
              catchError(() => of(false))
            );
          }),
          catchError((authError) => {
            console.warn('[AuthService] Firebase Auth login failed, checking database fallback:', authError?.message || authError);
            return this.firebaseService.getAllUsers().pipe(
              map((users) => {
                if (users) {
                  for (const uid of Object.keys(users)) {
                    const userObj = users[uid];
                    if (!userObj) continue;

                    const userEmail = (userObj.email || '').trim().toLowerCase();
                    const personalEmail = (userObj.personalEmail || '').trim().toLowerCase();
                    const appEmail = (userObj.appGeneratedEmail || '').trim().toLowerCase();
                    const mobile = (userObj.mobileNo || userObj.phone || userObj.phoneNumber || userObj.mobile || '').trim().toLowerCase();
                    const dbPassword = (userObj.password || '').trim();

                    const matchesIdentifier =
                      userEmail === cleanId ||
                      personalEmail === cleanId ||
                      appEmail === cleanId ||
                      mobile === cleanId;

                    if (matchesIdentifier && dbPassword === inputPassword) {
                      const legacyLocation = userObj.village
                        ? (userObj.mandal ? `${userObj.village}, ${userObj.mandal}` : userObj.village)
                        : (userObj.location || userObj.address || '');
                      const legacyUser: User = {
                        id: userObj.userId || uid,
                        email: userObj.personalEmail || userObj.email || inputIdentifier,
                        role: userObj.role || 'farmer',
                        name: userObj.name || (userObj.firstName ? userObj.firstName + ' ' + (userObj.lastName || '') : ''),
                        phone: userObj.mobileNo || userObj.phone || userObj.phoneNumber || '',
                        location: legacyLocation,
                        profileData: userObj
                      };
                      this.setCurrentUser(legacyUser);
                      this.startSessionTimeout();
                      return true;
                    }
                  }
                }

                // Check demo / mock accounts fallback
                const demoUser = this.validateUser({ email: inputIdentifier, password: inputPassword });
                if (demoUser) {
                  this.setCurrentUser(demoUser);
                  this.startSessionTimeout();
                  return true;
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

  /**
   * Validates user against provided Firebase user list, supporting both flat and legacy nested structures.
   */
  validateFirebaseUser(identifier: string, password: string, firebaseUsers: any): User | null {
    try {
      if (!firebaseUsers) return null;
      const cleanId = (identifier || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();

      // Normalize if raw nested object is passed
      const normalizedUsers = this.firebaseService.normalizeUsersMap(firebaseUsers);

      for (const userId of Object.keys(normalizedUsers)) {
        const user = normalizedUsers[userId];
        if (!user) continue;

        const userEmail = (user.email || '').trim().toLowerCase();
        const personalEmail = (user.personalEmail || '').trim().toLowerCase();
        const appEmail = (user.appGeneratedEmail || '').trim().toLowerCase();
        const mobile = (user.mobileNo || user.phone || user.phoneNumber || user.mobile || '').trim().toLowerCase();
        const userPass = (user.password || '').trim();

        if (
          (userEmail === cleanId || personalEmail === cleanId || appEmail === cleanId || mobile === cleanId) &&
          userPass === cleanPass
        ) {
          const phoneNumber = user.phone || user.phoneNumber || user.mobileNo || user.mobile || '';
          return {
            id: user.userId || userId,
            email: user.personalEmail || user.email || identifier,
            role: user.role || 'farmer',
            name: user.name || (user.firstName ? user.firstName + ' ' + (user.lastName || '') : ''),
            phone: phoneNumber,
            location: user.village || user.location || user.address || '',
            profileData: user
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Firebase user validation error:', error);
      return null;
    }
  }

  /** Validates against hardcoded mock demo credentials for development / test fallback */
  private validateUser({ email, password }: LoginCredentials): User | null {
    const cleanEmail = (email || '').trim().toLowerCase();
    const demo = AuthService.DEMO_ACCOUNTS[cleanEmail];
    if (demo && demo.password === (password || '').trim()) {
      return {
        id: `demo_${demo.role}`,
        email: cleanEmail,
        role: demo.role,
        name: demo.name,
        phone: '9999999999',
        location: 'Demo Hub',
        profileData: { ...demo, email: cleanEmail }
      };
    }
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