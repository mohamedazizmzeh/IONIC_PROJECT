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
      <ion-title>❤️ Mes favoris</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
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
              <button class="fav-btn active" (click)="removeFavorite(movie)">
                ❤️
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
  styles: [`
    .movies-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 12px;
    }
    .movie-card {
      border-radius: 8px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .poster-wrapper {
      position: relative;
      width: 100%;
      padding-bottom: 150%;
      background: #f0f0f0;
      overflow: hidden;
    }
    .poster-wrapper img {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
    }
    .no-poster {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      color: #ccc;
    }
    .fav-btn {
      position: absolute;
      top: 6px; right: 6px;
      width: 32px; height: 32px;
      border-radius: 50%;
      background: rgba(255,255,255,0.9);
      border: none;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      padding: 0;
      z-index: 2;
    }
    .movie-info { padding: 8px; }
    .movie-title {
      font-weight: 600;
      font-size: 12px;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      min-height: 30px;
    }
    .movie-meta {
      font-size: 11px;
      color: #666;
      margin-top: 4px;
    }
    @media (min-width: 768px) {
      .movies-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (min-width: 1200px) {
      .movies-grid { grid-template-columns: repeat(4, 1fr); }
    }
  `]
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
