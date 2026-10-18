import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { Subscription, catchError, from, map, mergeMap, of, toArray } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonText
} from '@ionic/angular';
import { TmdbService, TmdbMovie } from '../../../core/services/tmdb.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonText],
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title>Ma collection</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content><div class="page-intro"><h1>Les films qui te ressemblent.</h1><p>Tous tes coups de cœur, réunis au même endroit.</p></div>
    @if (error()) {
      <div class="request-error" role="alert"><p>{{ error() }}</p><button type="button" (click)="load()">Réessayer</button></div>
    }
    @if (loading()) {
      <div style="text-align: center; padding: 40px;">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    } @else if (!error() && movies().length === 0) {
      <ion-text color="medium">
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 60px;">💔</div>
          <p style="font-size: 16px; margin-top: 16px;">
            Aucun film dans tes favoris.
          </p>
          <p style="font-size: 14px;">
            Va dans <strong>Accueil</strong> et clique sur 🤍 pour en ajouter.
          </p>
        </div>
      </ion-text>
    } @else {
      <div class="movies-grid">
        @for (movie of movies(); track movie.id) {
          <div class="movie-card">
            <div class="poster-wrapper">
              <div class="no-poster">🎬</div>
              @if (movie.poster_path) {
                <img
                  [src]="tmdb.poster(movie.poster_path)"
                  [alt]="movie.title"
                  loading="lazy"
                  decoding="async" />
              }
              <button class="fav-btn active" [disabled]="pendingFavorites().has(movie.id)" [attr.aria-label]="'Retirer des favoris : ' + movie.title" (click)="removeFavorite(movie)">
                ♥
              </button>
            </div>
            <div class="movie-info">
              <div class="movie-title">{{ movie.title }}</div>
              <div class="movie-meta">
                ⭐ {{ movie.vote_average?.toFixed(1) ?? 'N/A' }}
                @if (movie.release_date) {
                  • {{ movie.release_date.substring(0, 4) }}
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  </ion-content>
  `,
  styleUrls: ['./favorites.page.scss']
})
export class FavoritesPage implements OnDestroy {
  tmdb = inject(TmdbService);
  private users = inject(UserService);
  pendingFavorites = this.users.pendingFavorites;
  private auth = inject(AuthService);

  // ✅ Signals
  movies = signal<TmdbMovie[]>([]);
  loading = signal(true);
  error = signal('');
  private movieRequest?: Subscription;

  constructor() {
    effect(() => {
      this.auth.currentUser();
      this.load();
    });
  }

  load() {
    this.movieRequest?.unsubscribe();
    this.error.set('');
    this.movies.set([]);
    const user = this.auth.currentUser();
    if (!user || user.favorites.length === 0) {
      this.movies.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    const ids = [...new Set<number>(user.favorites)];
    this.movieRequest = from(ids).pipe(
      mergeMap(id => this.tmdb.getById(id).pipe(
        map(movie => ({ movie, failed: false })),
        catchError(() => of({ movie: null, failed: true }))
      ), 4),
      toArray()
    ).subscribe(results => {
      const movies = results.map(result => result.movie).filter((movie): movie is TmdbMovie => movie !== null);
      this.movies.set(movies.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)));
      if (results.some(result => result.failed)) {
        this.error.set('Certains favoris n’ont pas pu être chargés. Réessaie pour les récupérer.');
      }
      this.loading.set(false);
    });
  }

  ngOnDestroy() {
    this.movieRequest?.unsubscribe();
  }

  removeFavorite(movie: any) {
    this.users.removeFavorite(movie.id).subscribe({
      error: () => this.error.set('Le favori n’a pas pu être retiré. Ton choix précédent a été conservé. Réessaie.')
    });
  }
}
