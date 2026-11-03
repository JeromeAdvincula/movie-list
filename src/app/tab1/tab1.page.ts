
import { Component, inject } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc
} from 'firebase/firestore';

import { environment } from '../../environments/environment';

const app = getApps().length
  ? getApp()
  : initializeApp(environment.firebaseConfig);

const db = getFirestore(app);

const movieCol = collection(db, 'movies');

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {

  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  newMovie = {
    title: '',
    genre: '',
    duration: 0,
    status: 'Released',
    rating: 0
  };

  async addMovie() {

    // VALIDATION
    if (
      !this.newMovie.title.trim() ||
      !this.newMovie.genre.trim() ||
      this.newMovie.duration <= 0 ||
      this.newMovie.rating < 1 ||
      this.newMovie.rating > 10
    ) {
      await this.showToast(
        'Please fill in all fields correctly.'
      );
      return;
    }

    // SHOW LOADING
    const loading = await this.loadingCtrl.create({
      message: 'Adding movie...',
      spinner: 'crescent'
    });

    await loading.present();

    // ADD TO FIRESTORE
    try {
      await addDoc(movieCol, {
        ...this.newMovie
      });

      await this.showToast(
        'Movie added successfully!'
      );

      // RESET FORM
      this.newMovie = {
        title: '',
        genre: '',
        duration: 0,
        status: 'Released',
        rating: 0
      };

    } catch (error) {
      console.error('Add movie error:', error);

      await this.showToast(
        'Failed to add movie.'
      );

    } finally {
      await loading.dismiss();
    }
  }

  // TOAST MESSAGE
  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });

    await toast.present();
  }
}
