import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp } from 'firebase/app';
import { Database, getDatabase, ref, push, set } from 'firebase/database';
import { Auth, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseConfig } from '../../environments/firebase.config';

export interface SignupUser {
  name: string;
  typicalCrops: string[];
  village: string;
  waterSource: string;
  mandal: string;
  soilTest: string;
  mobileNo: string;
  soilType: string;
  acreOfLand: number | null;
  fertilizers: string[] | string;
  role?: string;
  email?: string;
  personalEmail?: string;
  password?: string;
  userId?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private baseUrl = firebaseConfig.databaseURL || 'https://intra-d-default-rtdb.asia-southeast1.firebasedatabase.app';
  private readonly db: Database | null = null;
  private readonly auth: Auth | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only initialize Firebase in browser context
    if (isPlatformBrowser(this.platformId)) {
      const app = initializeApp(firebaseConfig);
      this.db = getDatabase(app);
      this.auth = getAuth(app);
    }
  }

  // Create user securely with Auth + Database PUT using UID
  createUser(userData: SignupUser): Observable<any> {
    const generatedPassword = this.generatePassword();
    const namePart = userData.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const uniqueSuffix = Date.now().toString(36).slice(-4); // e.g. "k3f2"
    const appGeneratedEmail = `${namePart}${uniqueSuffix}@intra-d.com`;
    const personalEmail = (userData.personalEmail && userData.personalEmail.trim())
      ? userData.personalEmail.trim()
      : '';

    const attemptEmail = personalEmail || appGeneratedEmail;

    return this.signupWithEmailPassword(attemptEmail, generatedPassword).pipe(
      catchError((err: any) => {
        // If creating Auth account with personalEmail fails (e.g. email-already-in-use), fall back to appGeneratedEmail
        if (personalEmail && attemptEmail !== appGeneratedEmail) {
          console.warn('[FirebaseService] Personal email Auth creation failed, falling back to app email:', err?.code || err?.message);
          return this.signupWithEmailPassword(appGeneratedEmail, generatedPassword);
        }
        return throwError(() => err);
      }),
      switchMap((authResult: any) => {
        const uid = authResult.user.uid;
        const usedAuthEmail = authResult?.user?.email || attemptEmail;
        const { password: _removed, ...safeData } = userData as any;
        const userWithCredentials = {
          ...safeData,
          userId: uid,
          email: usedAuthEmail,
          personalEmail: personalEmail || usedAuthEmail,
          appGeneratedEmail,
          role: userData.role || 'farmer',
          createdAt: new Date().toISOString()
          // password intentionally excluded from DB record
        };

        return this.http.put(`${this.baseUrl}/signUpFrom/${uid}.json`, userWithCredentials)
          .pipe(
            map(() => ({
              email: usedAuthEmail,
              personalEmail: personalEmail || usedAuthEmail,
              appGeneratedEmail,
              generatedPassword,
              name: userData.name,
              userId: uid
            }))
          );
      })
    );
  }

  // Helper to find a user in RTDB by personalEmail, email, mobileNo, or phone
  findUserByIdentifier(identifier: string): Observable<any> {
    if (!identifier) return of(null);
    const cleanId = identifier.trim().toLowerCase();
    return this.getAllUsers().pipe(
      map((users: any) => {
        if (!users) return null;
        for (const userId of Object.keys(users)) {
          const user = users[userId];
          if (!user) continue;
          const userEmail = (user.email || '').toLowerCase();
          const personalEmail = (user.personalEmail || '').toLowerCase();
          const mobile = (user.mobileNo || user.phone || '').toLowerCase();
          if (userEmail === cleanId || personalEmail === cleanId || mobile === cleanId) {
            return { ...user, userId };
          }
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  // Read user by ID
  getUser(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/signUpFrom/${userId}.json`);
  }

  // Update user
  updateUser(userId: string, userData: Partial<SignupUser>): Observable<any> {
    return this.http.patch(`${this.baseUrl}/signUpFrom/${userId}.json`, userData);
  }

  // Delete user
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/signUpFrom/${userId}.json`);
  }

  // Get all users
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/signUpFrom.json`);
  }

  // Update user password — only in Firebase Auth (DB no longer stores passwords)
  // Fix #3: data is stored flat at /signUpFrom/{uid} (PUT), not double-nested
  updateUserPassword(identifier: string, newPassword: string): Observable<any> {
    return this.getAllUsers().pipe(
      switchMap((users: any) => {
        if (!users) return of(null);

        // Users are stored flat: { [uid]: { email, mobileNo, ... } }
        for (const userId of Object.keys(users)) {
          const user = users[userId];
          if (
            user &&
            (user.email === identifier ||
              user.personalEmail === identifier ||
              user.mobileNo === identifier ||
              user.phone === identifier)
          ) {
            // Update only non-sensitive fields; passwords belong in Firebase Auth only
            // For a full password reset, use Firebase Auth sendPasswordResetEmail()
            return this.http.patch(
              `${this.baseUrl}/signUpFrom/${userId}.json`,
              { lastPasswordReset: new Date().toISOString() }
            );
          }
        }
        return of(null);
      })
    );
  }

  // Firebase Auth signup
  signupWithEmailPassword(email: string, password: string): Observable<any> {
    if (!this.auth) {
      return new Observable(observer => observer.error(new Error('Firebase Auth not initialized')));
    }
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  // Firebase Auth login
  loginWithEmailPassword(email: string, password: string): Observable<any> {
    if (!this.auth) {
      return new Observable(observer => observer.error(new Error('Firebase Auth not initialized')));
    }
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  // Firebase Auth password reset link
  sendPasswordResetEmail(email: string): Observable<void> {
    if (!this.auth) {
      return new Observable(observer => observer.error(new Error('Firebase Auth not initialized')));
    }
    return from(sendPasswordResetEmail(this.auth, email));
  }

  // Login authentication (log only — actual auth is via Firebase Auth SDK)
  authenticateUser(email: string, _password: string): Observable<any> {
    // Note: Login logging removed — no need to store login timestamps
    return of(null);
  }

  // Fix #8: verifyCredentials no longer dumps all user data
  verifyCredentials(_email: string, _password: string): Observable<any> {
    // Use loginWithEmailPassword() for actual credential verification
    return of(null);
  }

  // Create land lease application
  createLeaseApplication(leaseData: any): Observable<any> {
    const applicationId = this.generateApplicationId();
    const applicationWithId = {
      ...leaseData,
      applicationId,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    return this.http.post(`${this.baseUrl}/landLeaseApplication/${applicationId}.json`, applicationWithId);
  }

  // Get lease application by ID
  getLeaseApplication(applicationId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/landLeaseApplication/${applicationId}.json`);
  }

  // Update lease application
  updateLeaseApplication(applicationId: string, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/landLeaseApplication/${applicationId}.json`, data);
  }

  // Delete lease application
  deleteLeaseApplication(applicationId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/landLeaseApplication/${applicationId}.json`);
  }

  // Get all lease applications
  getAllLeaseApplications(): Observable<any> {
    return this.http.get(`${this.baseUrl}/landLeaseApplication.json`);
  }

  // Service Requests Management
  createServiceRequest(serviceData: any): Observable<any> {
    const requestId = this.generateRequestId();
    const requestWithId = {
      ...serviceData,
      requestId,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    return this.http.post(`${this.baseUrl}/serviceRequests/${requestId}.json`, requestWithId);
  }

  getAllServiceRequests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/serviceRequests.json`);
  }

  updateServiceRequest(requestId: string, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/serviceRequests/${requestId}.json`, data);
  }

  deleteServiceRequest(requestId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/serviceRequests/${requestId}.json`);
  }

  // Soil Test Requests
  getAllSoilTestRequests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/soilTest.json`);
  }

  updateSoilTestRequest(requestId: string, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/soilTest/${requestId}.json`, data);
  }

  // Buyer/Seller Forms
  createBuyerForm(buyerData: any): Observable<any> {
    const formId = this.generateRequestId();
    const formWithId = {
      ...buyerData,
      formId,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    // Use PUT (not POST) — POST wraps data in an extra Firebase auto-key, breaking Object.entries() reads
    return this.http.put(`${this.baseUrl}/buyerForms/${formId}.json`, formWithId);
  }

  getAllBuyerForms(): Observable<any> {
    return this.http.get(`${this.baseUrl}/buyerForms.json`);
  }

  /**
   * Fetch all buyer form submissions for a specific buyer email.
   * Firebase Realtime DB doesn't support server-side equality filters on nested fields,
   * so we load all forms and filter client-side — no data is lost.
   */
  getBuyerFormsByEmail(email: string): Observable<any[]> {
    return this.getAllBuyerForms().pipe(
      map((forms: any) => {
        if (!forms) return [];
        return Object.values(forms)
          .filter((form: any) => form?.buyer?.email === email)
          .sort((a: any, b: any) =>
            new Date(b.timestamp || b.submittedAt || 0).getTime() -
            new Date(a.timestamp || a.submittedAt || 0).getTime()
          );
      })
    );
  }

  createSellerForm(sellerData: any): Observable<any> {
    const formId = this.generateRequestId();
    const formWithId = {
      ...sellerData,
      formId,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    // Use PUT (not POST) — POST wraps data in an extra Firebase auto-key, breaking Object.entries() reads
    return this.http.put(`${this.baseUrl}/sellerForms/${formId}.json`, formWithId);
  }

  getAllSellerForms(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sellerForms.json`);
  }

  private generateRequestId(): string {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  private generateApplicationId(): string {
    return 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  // Fix #6: Use crypto.getRandomValues() — cryptographically secure password generation
  private generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
    const array = new Uint8Array(10);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => chars[b % chars.length])
      .join('');
  }
}