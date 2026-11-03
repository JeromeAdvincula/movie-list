
import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import {
  AlertController,
  LoadingController
} from '@ionic/angular';

import {
  getApp,
  getApps,
  initializeApp
} from 'firebase/app';

import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Unsubscribe
} from 'firebase/firestore';

import { environment } from '../../environments/environment';

const app = getApps().length
  ? getApp()
  : initializeApp(environment.firebaseConfig);

const db = getFirestore(app);

const movieCol = collection(db, 'movies');

interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: number;
  status: string;
  rating: number;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit, OnDestroy {

  // MOVIE DATA
  movieList: Movie[] = [];

  // SEARCH AND FILTER
  searchTerm = '';
  selectedStatus = 'All';

  // UPDATE MODAL
  updateModalOpen = false;

  selectedMovie: Movie = {
    id: '',
    title: '',
    genre: '',
    duration: 0,
    status: 'Released',
    rating: 0
  };

  // TOAST
  toastOpen = false;
  toastMessage = '';

  private unsubscribeMovies?: Unsubscribe;

  // SERVICES
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);

  // INITIALIZE
  ngOnInit() {
    this.subscribeToMovies();
  }

  ngOnDestroy() {
    this.unsubscribeMovies?.();
  }

  // READ MOVIES
  async subscribeToMovies() {

    const loading = await this.loadingCtrl.create({
      message: 'Loading movies...',
      spinner: 'crescent'
    });

    await loading.present();

    let firstResult = true;

    this.unsubscribeMovies = onSnapshot(
      movieCol,

      (snapshot) => {

        this.ngZone.run(() => {

          this.movieList = snapshot.docs.map(
            (movieDoc) => ({
              id: movieDoc.id,
              ...movieDoc.data()
            } as Movie)
          );

          console.log('Movies loaded:', this.movieList);

          this.cdr.detectChanges();
        });

        if (firstResult) {
          firstResult = false;
          void loading.dismiss();
        }
      },

      (error) => {

        console.error('Firestore read error:', error);

        if (firstResult) {
          firstResult = false;
          void loading.dismiss();
        }

        this.ngZone.run(() => {
          this.showToast('Failed to load movies.');
        });
      }
    );
  }

  // SEARCH AND FILTER
  get filteredMovieList(): Movie[] {

    return this.movieList.filter((movie) => {

      const title = movie.title?.toLowerCase() || '';
      const genre = movie.genre?.toLowerCase() || '';
      const search = this.searchTerm.toLowerCase().trim();

      const matchesSearch =
        title.includes(search) ||
        genre.includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        movie.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // OPEN UPDATE MODAL
  openUpdateModal(movie: Movie) {

    this.selectedMovie = {
      ...movie
    };

    this.updateModalOpen = true;
  }

  // UPDATE MOVIE
  async saveUpdate() {

    if (
      !this.selectedMovie.title.trim() ||
      !this.selectedMovie.genre.trim() ||
      Number(this.selectedMovie.duration) <= 0 ||
      Number(this.selectedMovie.rating) < 1 ||
      Number(this.selectedMovie.rating) > 10
    ) {
      this.showToast('Please enter valid movie details.');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Updating movie...',
      spinner: 'crescent'
    });

    await loading.present();

    try {

      const movieRef = doc(
        db,
        'movies',
        this.selectedMovie.id
      );

      await updateDoc(movieRef, {
        title: this.selectedMovie.title.trim(),
        genre: this.selectedMovie.genre.trim(),
        duration: Number(this.selectedMovie.duration),
        status: this.selectedMovie.status,
        rating: Number(this.selectedMovie.rating)
      });

      this.updateModalOpen = false;

      this.showToast('Movie updated successfully!');

    } catch (error) {

      console.error('Update error:', error);

      this.showToast('Failed to update movie.');

    } finally {
      await loading.dismiss();
    }
  }

  // DELETE MOVIE
  async deleteMovie(movieId: string) {

    const alert = await this.alertCtrl.create({
      header: 'Delete Movie',
      message: 'Are you sure you want to delete this movie?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive'
        }
      ]
    });

    await alert.present();

    const result = await alert.onDidDismiss();

    if (result.role === 'destructive') {

      const loading = await this.loadingCtrl.create({
        message: 'Deleting movie...',
        spinner: 'crescent'
      });

      await loading.present();

      try {

        const movieRef = doc(db, 'movies', movieId);

        await deleteDoc(movieRef);

        this.showToast('Movie deleted successfully!');

      } catch (error) {

        console.error('Delete error:', error);

        this.showToast('Failed to delete movie.');

      } finally {
        await loading.dismiss();
      }
    }
  }

  // REFRESH
  async refreshMovies(event: any) {

    try {
      // onSnapshot automatically receives
      // real-time updates from Firestore.
      this.cdr.detectChanges();

    } finally {
      event.target.complete();
    }
  }

  // TOAST
  showToast(message: string) {
    this.toastMessage = message;
    this.toastOpen = true;
  }

  closeToast() {
    this.toastOpen = false;
  }
}
