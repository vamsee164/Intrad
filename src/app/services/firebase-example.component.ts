import { Component } from '@angular/core';
import { FirebaseDatabaseService } from './firebase-database.service';

@Component({
  selector: 'app-firebase-example',
  template: `
    <div>
      <h3>Firebase Database Example</h3>
      <button (click)="writeData()">Write Data</button>
      <button (click)="readData()">Read Data</button>
      <button (click)="listenData()">Listen to Data</button>
      <button (click)="updateData()">Update Data</button>
      <button (click)="deleteData()">Delete Data</button>
      <div *ngIf="data">Data: {{ data | json }}</div>
    </div>
  `
})
export class FirebaseExampleComponent {
  data: any;

  constructor(private firebaseService: FirebaseDatabaseService) {}

  async writeData() {
    await this.firebaseService.setData('users/user1', { name: 'John', age: 30 });
    console.log('Data written');
  }

  async readData() {
    this.data = await this.firebaseService.getData('users/user1');
  }

  listenData() {
    this.firebaseService.listenToData('users/user1').subscribe(data => {
      this.data = data;
    });
  }

  async updateData() {
    await this.firebaseService.updateData('users/user1', { age: 31 });
    console.log('Data updated');
  }

  async deleteData() {
    await this.firebaseService.deleteData('users/user1');
    console.log('Data deleted');
  }
}