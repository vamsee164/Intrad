import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  // Authentication
  async signIn(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async signUp(email: string, password: string) {
    return await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async signOut() {
    return await signOut(this.auth);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Firestore operations
  async addDocument(collectionName: string, data: any) {
    const collectionRef = collection(this.firestore, collectionName);
    return await addDoc(collectionRef, data);
  }

  async getDocuments(collectionName: string) {
    const collectionRef = collection(this.firestore, collectionName);
    return await getDocs(collectionRef);
  }

  async updateDocument(collectionName: string, docId: string, data: any) {
    const docRef = doc(this.firestore, collectionName, docId);
    return await updateDoc(docRef, data);
  }

  async deleteDocument(collectionName: string, docId: string) {
    const docRef = doc(this.firestore, collectionName, docId);
    return await deleteDoc(docRef);
  }
}