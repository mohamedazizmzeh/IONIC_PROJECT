import { Component, OnInit, inject, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonText
} from '@ionic/angular';
import { TmdbService } from '../../../core/services/tmdb.service';
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
    @if (loading()) {
      <div style="text-align: center; padding: 40px;">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    } @else if (movies().length === 0) {
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
              <button class="fav-btn active" [attr.aria-label]="'Retirer des favoris : ' + movie.title" (click)="removeFavorite(movie)">
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
export class FavoritesPage implements OnInit {
  tmdb = inject(TmdbService);
  private users = inject(UserService);
  private auth = inject(AuthService);

  // ✅ Signals
  movies = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.load();
  }

  load() {
    const user = this.auth.currentUser();
    if (!user || user.favorites.length === 0) {
      this.movies.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    user.favorites.forEach((id: number) => {
      this.tmdb.getById(id).subscribe({
        next: (movie) => {
          this.movies.update(list => [...list, movie]);
        },
        error: (err) => {
          console.error('Erreur film', id, err);
        }
      });
    });

    this.loading.set(false);
  }

  removeFavorite(movie: any) {
    this.users.removeFavorite(movie.id).subscribe({
      next: (res: any) => {
        // Mettre à jour le user
        const user = this.auth.currentUser();
        if (user) {
          const updated = { ...user, favorites: res.favorites };
          localStorage.setItem('user', JSON.stringify(updated));
          this.auth.currentUser.set(updated);
        }
        // Retirer de la liste locale
        this.movies.update(list => list.filter(m => m.id !== movie.id));
      },
      error: (err) => console.error('Erreur:', err)
    });
  }
}
