import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp, getApps, getApp } from 'firebase/app';
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
  private db: Database | null = null;
  private auth: Auth | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initFirebase();
  }

  private initFirebase(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        this.db = getDatabase(app);
        this.auth = getAuth(app);
      } catch (err) {
        console.warn('[FirebaseService] Firebase init warning:', err);
      }
    }
  }

  private getAuthInstance(): Auth | null {
    if (this.auth) return this.auth;
    this.initFirebase();
    return this.auth;
  }

  // Create user securely with Auth + Database PUT using UID
  createUser(userData: SignupUser): Observable<any> {
    const generatedPassword = this.generatePassword();
    const cleanName = (userData.name || '').trim();
    const namePart = cleanName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') || 'user';
    const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const appGeneratedEmail = `${namePart}${uniqueSuffix}@intra-d.com`;
    const personalEmail = (userData.personalEmail && userData.personalEmail.trim())
      ? userData.personalEmail.trim()
      : '';

    const attemptEmail = personalEmail || appGeneratedEmail;

    const saveUserToDb = (uid: string, usedEmail: string) => {
      const { password: _removed, ...safeData } = userData as any;
      const userWithCredentials = {
        ...safeData,
        userId: uid,
        email: usedEmail,
        personalEmail: personalEmail || usedEmail,
        appGeneratedEmail,
        password: generatedPassword, // Saved for database-fallback login
        role: userData.role || 'farmer',
        createdAt: new Date().toISOString()
      };

      return this.http.put(`${this.baseUrl}/signUpFrom/${uid}.json`, userWithCredentials)
        .pipe(
          map(() => ({
            email: usedEmail,
            personalEmail: personalEmail || usedEmail,
            appGeneratedEmail,
            generatedPassword,
            name: userData.name,
            userId: uid
          }))
        );
    };

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
        return saveUserToDb(uid, usedAuthEmail);
      }),
      catchError((authErr: any) => {
        console.warn('[FirebaseService] Firebase Auth signup unavailable/failed, using direct database registration:', authErr?.code || authErr?.message);
        const fallbackUid = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        const usedEmail = personalEmail || appGeneratedEmail;
        return saveUserToDb(fallbackUid, usedEmail);
      })
    );
  }

  /**
   * Normalizes raw Firebase signUpFrom data into a unified flat dictionary: { [userId]: userProfile }
   * Supports both modern flat schema (/signUpFrom/{uid}) and legacy nested schema (/signUpFrom/{uid}/{pushKey})
   */
  normalizeUsersMap(rawUsers: any): Record<string, any> {
    if (!rawUsers || typeof rawUsers !== 'object') return {};
    const normalized: Record<string, any> = {};

    for (const key of Object.keys(rawUsers)) {
      const entry = rawUsers[key];
      if (!entry || typeof entry !== 'object') continue;

      // Case 1: Direct flat user object (has standard user profile fields)
      if (
        entry.email !== undefined ||
        entry.personalEmail !== undefined ||
        entry.appGeneratedEmail !== undefined ||
        entry.name !== undefined ||
        entry.role !== undefined ||
        entry.mobileNo !== undefined ||
        entry.phone !== undefined ||
        entry.password !== undefined
      ) {
        normalized[key] = {
          ...entry,
          userId: entry.userId || key
        };
        continue;
      }

      // Case 2: Legacy nested container (e.g. entry = { [pushKey]: { ... } })
      let foundNested = false;
      for (const nestedKey of Object.keys(entry)) {
        const nestedObj = entry[nestedKey];
        if (nestedObj && typeof nestedObj === 'object') {
          const resolvedId = nestedObj.userId || key || nestedKey;
          normalized[resolvedId] = {
            ...nestedObj,
            userId: resolvedId,
            _parentKey: key,
            _pushKey: nestedKey
          };
          foundNested = true;
        }
      }

      // Fallback if neither matched
      if (!foundNested) {
        normalized[key] = { ...entry, userId: entry.userId || key };
      }
    }

    return normalized;
  }

  // Helper to find a user in RTDB by personalEmail, email, mobileNo, or phone (supports flat & nested)
  findUserByIdentifier(identifier: string): Observable<any> {
    if (!identifier) return of(null);
    const cleanId = identifier.trim().toLowerCase();
    return this.getAllUsers().pipe(
      map((users: any) => {
        if (!users) return null;
        for (const userId of Object.keys(users)) {
          const user = users[userId];
          if (!user) continue;
          const userEmail = (user.email || '').trim().toLowerCase();
          const personalEmail = (user.personalEmail || '').trim().toLowerCase();
          const appEmail = (user.appGeneratedEmail || '').trim().toLowerCase();
          const mobile = (user.mobileNo || user.phone || user.phoneNumber || user.mobile || '').trim().toLowerCase();
          
          if (
            userEmail === cleanId ||
            personalEmail === cleanId ||
            appEmail === cleanId ||
            mobile === cleanId
          ) {
            return { ...user, userId: user.userId || userId };
          }
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  // Read user by ID (handles both flat and legacy nested records)
  getUser(userId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/signUpFrom/${userId}.json`).pipe(
      map((userData) => {
        if (!userData) return null;
        // Direct flat object
        if (
          userData.email !== undefined ||
          userData.personalEmail !== undefined ||
          userData.appGeneratedEmail !== undefined ||
          userData.name !== undefined ||
          userData.role !== undefined ||
          userData.mobileNo !== undefined ||
          userData.phone !== undefined
        ) {
          return { ...userData, userId: userData.userId || userId };
        }
        // Nested under pushKey
        const keys = Object.keys(userData);
        if (keys.length > 0) {
          const firstVal = userData[keys[0]];
          if (firstVal && typeof firstVal === 'object') {
            return { ...firstVal, userId: firstVal.userId || userId, _pushKey: keys[0] };
          }
        }
        return { ...userData, userId };
      }),
      catchError(() => of(null))
    );
  }

  // Update user
  updateUser(userId: string, userData: Partial<SignupUser>): Observable<any> {
    return this.http.patch(`${this.baseUrl}/signUpFrom/${userId}.json`, userData);
  }

  // Delete user
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/signUpFrom/${userId}.json`);
  }

  // Get all users (normalized for both flat and legacy nested schemas)
  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/signUpFrom.json`).pipe(
      map((rawUsers) => this.normalizeUsersMap(rawUsers)),
      catchError((err) => {
        console.error('[FirebaseService] Error fetching users:', err);
        return of({});
      })
    );
  }

  // Update user password — only in Firebase Auth (DB no longer stores passwords)
  // Supports both flat (/signUpFrom/{uid}) and legacy nested records
  updateUserPassword(identifier: string, newPassword: string): Observable<any> {
    const cleanId = (identifier || '').trim().toLowerCase();
    return this.getAllUsers().pipe(
      switchMap((users: any) => {
        if (!users) return of(null);

        for (const userId of Object.keys(users)) {
          const user = users[userId];
          if (!user) continue;

          const userEmail = (user.email || '').trim().toLowerCase();
          const personalEmail = (user.personalEmail || '').trim().toLowerCase();
          const appEmail = (user.appGeneratedEmail || '').trim().toLowerCase();
          const mobile = (user.mobileNo || user.phone || user.phoneNumber || user.mobile || '').trim().toLowerCase();

          if (
            userEmail === cleanId ||
            personalEmail === cleanId ||
            appEmail === cleanId ||
            mobile === cleanId
          ) {
            const updatePath = user._pushKey && user._parentKey
              ? `${this.baseUrl}/signUpFrom/${user._parentKey}/${user._pushKey}.json`
              : `${this.baseUrl}/signUpFrom/${userId}.json`;

            return this.http.patch(
              updatePath,
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
    const auth = this.getAuthInstance();
    if (!auth) {
      return throwError(() => new Error('Firebase Auth not initialized'));
    }
    return from(createUserWithEmailAndPassword(auth, email, password));
  }

  // Firebase Auth login
  loginWithEmailPassword(email: string, password: string): Observable<any> {
    const auth = this.getAuthInstance();
    if (!auth) {
      return throwError(() => new Error('Firebase Auth not initialized'));
    }
    return from(signInWithEmailAndPassword(auth, email, password));
  }

  // Firebase Auth password reset link
  sendPasswordResetEmail(email: string): Observable<void> {
    const auth = this.getAuthInstance();
    if (!auth) {
      return throwError(() => new Error('Firebase Auth not initialized'));
    }
    return from(sendPasswordResetEmail(auth, email));
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

    return this.http.put(`${this.baseUrl}/serviceRequests/${requestId}.json`, requestWithId);
  }

  getAllServiceRequests(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/serviceRequests.json`).pipe(
      map((raw) => {
        if (!raw || typeof raw !== 'object') return {};
        const normalized: Record<string, any> = {};
        for (const key of Object.keys(raw)) {
          const entry = raw[key];
          if (!entry || typeof entry !== 'object') continue;
          if (entry.serviceName || entry.farmerName || entry.serviceType || entry.selectedEquipment || entry.status) {
            normalized[key] = { id: key, requestId: key, ...entry };
          } else {
            const subKeys = Object.keys(entry);
            if (subKeys.length > 0 && typeof entry[subKeys[0]] === 'object' && entry[subKeys[0]] !== null) {
              normalized[key] = { id: key, requestId: key, _nestedKey: subKeys[0], ...entry[subKeys[0]] };
            } else {
              normalized[key] = { id: key, requestId: key, ...entry };
            }
          }
        }
        return normalized;
      }),
      catchError((err) => {
        console.error('[FirebaseService] Error fetching service requests:', err);
        return of({});
      })
    );
  }

  updateServiceRequest(requestId: string, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/serviceRequests/${requestId}.json`, data);
  }

  deleteServiceRequest(requestId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/serviceRequests/${requestId}.json`);
  }

  // Soil Test Requests
  getAllSoilTestRequests(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/soilTest.json`).pipe(
      map((raw) => {
        if (!raw || typeof raw !== 'object') return {};
        const normalized: Record<string, any> = {};
        for (const key of Object.keys(raw)) {
          const entry = raw[key];
          if (!entry || typeof entry !== 'object') continue;
          if (entry.farmerName || entry.sampleDate || entry.status || entry.currentCrop) {
            normalized[key] = { id: key, requestId: key, ...entry };
          } else {
            const subKeys = Object.keys(entry);
            if (subKeys.length > 0 && typeof entry[subKeys[0]] === 'object' && entry[subKeys[0]] !== null) {
              normalized[key] = { id: key, requestId: key, _nestedKey: subKeys[0], ...entry[subKeys[0]] };
            } else {
              normalized[key] = { id: key, requestId: key, ...entry };
            }
          }
        }
        return normalized;
      }),
      catchError((err) => {
        console.error('[FirebaseService] Error fetching soil test requests:', err);
        return of({});
      })
    );
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
   * Fetch all buyer form submissions for a specific buyer email or phone.
   * Firebase Realtime DB doesn't support server-side equality filters on nested fields,
   * so we load all forms and filter client-side — no data is lost.
   */
  getBuyerFormsByEmail(email: string, phone?: string): Observable<any[]> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim().toLowerCase();
    return this.getAllBuyerForms().pipe(
      map((forms: any) => {
        if (!forms) return [];
        return Object.values(forms)
          .filter((form: any) => {
            const formEmail = (form?.buyer?.email || form?.email || '').trim().toLowerCase();
            const formPhone = (form?.buyer?.phone || form?.phone || form?.contactNo || '').trim().toLowerCase();
            const matchEmail = cleanEmail && formEmail === cleanEmail;
            const matchPhone = cleanPhone && formPhone === cleanPhone;
            return matchEmail || matchPhone;
          })
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

  /**
   * Fetch all seller form submissions for a specific seller email or phone.
   */
  getSellerFormsByEmail(email: string, phone?: string): Observable<any[]> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim().toLowerCase();
    return this.getAllSellerForms().pipe(
      map((forms: any) => {
        if (!forms) return [];
        return Object.values(forms)
          .filter((form: any) => {
            const formEmail = (form?.email || form?.sellerEmail || '').trim().toLowerCase();
            const formPhone = (form?.contactNo || form?.phone || form?.mobileNo || '').trim().toLowerCase();
            const matchEmail = cleanEmail && formEmail === cleanEmail;
            const matchPhone = cleanPhone && formPhone === cleanPhone;
            return matchEmail || matchPhone;
          })
          .sort((a: any, b: any) =>
            new Date(b.timestamp || b.submittedAt || 0).getTime() -
            new Date(a.timestamp || a.submittedAt || 0).getTime()
          );
      })
    );
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