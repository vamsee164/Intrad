import { Injectable } from '@angular/core';
import { Database, ref, set, get, push, remove, update, onValue, off } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDatabaseService {

  constructor(private db: Database) { }

  // Create/Set data
  setData(path: string, data: any): Promise<void> {
    return set(ref(this.db, path), data);
  }

  // Push data (auto-generated key)
  pushData(path: string, data: any): Promise<any> {
    return push(ref(this.db, path), data);
  }

  // Read data once
  getData(path: string): Promise<any> {
    return get(ref(this.db, path)).then(snapshot => snapshot.val());
  }

  // Listen to data changes
  listenToData(path: string): Observable<any> {
    return new Observable(observer => {
      const dbRef = ref(this.db, path);
      const unsubscribe = onValue(dbRef, snapshot => {
        observer.next(snapshot.val());
      });
      return () => off(dbRef, 'value', unsubscribe);
    });
  }

  // Update data
  updateData(path: string, updates: any): Promise<void> {
    return update(ref(this.db, path), updates);
  }

  // Delete data
  deleteData(path: string): Promise<void> {
    return remove(ref(this.db, path));
  }
}