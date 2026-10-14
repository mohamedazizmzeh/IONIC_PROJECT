import { Component, OnInit, inject, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar,
  IonSpinner, IonText
} from '@ionic/angular';
import { TmdbService } from '../../../core/services/tmdb.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { MovieService } from '../../../core/services/movie.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSearchbar, IonSpinner, IonText
  ],
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title>🎬 Films</ion-title>
    </ion-toolbar>

    <!-- Toggle Populaires / Catalogue -->
    <div class="tabs">
      <button
        class="tab"
        [class.active]="activeTab() === 'popular'"
        (click)="switchTab('popular')">
        🔥 Populaires
      </button>
      <button
        class="tab"
        [class.active]="activeTab() === 'catalog'"
        (click)="switchTab('catalog')">
        ⭐ Catalogue
        @if (catalogCount() > 0) {
          <span class="count">{{ catalogCount() }}</span>
        }
      </button>
    </div>

    <!-- Barre de recherche (visible uniquement dans Populaires) -->
    @if (activeTab() === 'popular') {
      <ion-toolbar>
        <ion-searchbar
          [value]="query()"
          (ionChange)="onSearch($event)"
          placeholder="Rechercher un film..."
          debounce="600">
        </ion-searchbar>
      </ion-toolbar>
    }
  </ion-header>

  <ion-content>
    @if (loading()) {
      <div class="loader">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement...</p>
      </div>
    } @else if (movies().length === 0) {
      <ion-text color="medium">
        <div class="empty-state">
          @if (activeTab() === 'catalog') {
            <div class="empty-icon">📭</div>
            <p>Catalogue vide</p>
            <p class="hint">Aucun film n'a encore été ajouté par l'administrateur.</p>
          } @else if (query()) {
            <div class="empty-icon">🔍</div>
            <p>Aucun résultat pour "{{ query() }}"</p>
          } @else {
            <div class="empty-icon">🎬</div>
            <p>Aucun film disponible</p>
          }
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
              <button
                class="fav-btn"
                [class.active]="isFavorite(movie.id)"
                (click)="toggleFavorite(movie, $event)">
                {{ isFavorite(movie.id) ? '❤️' : '🤍' }}
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
    /* Onglets */
    .tabs {
      display: flex;
      background: #f4f5f8;
      border-bottom: 1px solid #e0e0e0;
    }
    .tab {
      flex: 1;
      padding: 12px 8px;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .tab.active {
      color: #3880ff;
      border-bottom-color: #3880ff;
      background: #fff;
    }
    .count {
      background: #3880ff;
      color: white;
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 11px;
    }

    /* Loader */
    .loader {
      text-align: center;
      padding: 40px;
    }

    /* Grille films */
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
    .fav-btn.active { background: #fff; }
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

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }
    .empty-state .empty-icon {
      font-size: 60px;
      margin-bottom: 12px;
    }
    .empty-state .hint {
      font-size: 13px;
      color: #bbb;
      margin-top: 8px;
    }

    /* Grands écrans */
    @media (min-width: 768px) {
      .movies-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (min-width: 1200px) {
      .movies-grid { grid-template-columns: repeat(4, 1fr); }
    }
  `]
})
export class HomePage implements OnInit {
  tmdb = inject(TmdbService);
  private users = inject(UserService);
  private auth = inject(AuthService);
  private movieSrv = inject(MovieService);

  // État
  activeTab = signal<'popular' | 'catalog'>('popular');
  movies = signal<any[]>([]);
  loading = signal(false);
  query = signal('');
  catalogCount = signal(0);

  ngOnInit() {
    this.loadPopular();
    this.loadCatalogCount();
  }

  // ============ POPULAIRES (TMDB) ============
  loadPopular() {
    this.loading.set(true);
    this.tmdb.getPopular().subscribe({
      next: (movies) => {
        this.movies.set(movies);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(event: any) {
    const q = (event.detail?.value ?? '').trim();
    this.query.set(q);

    if (!q) {
      this.loadPopular();
      return;
    }
    if (q.length < 2) return;

    this.loading.set(true);
    this.tmdb.search(q).subscribe({
      next: (movies) => {
        this.movies.set(movies);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // ============ CATALOGUE (Admin) ============
  loadCatalogCount() {
    this.movieSrv.list().subscribe({
      next: (list) => this.catalogCount.set(list.length)
    });
  }

  loadCatalog() {
    this.loading.set(true);
    this.movieSrv.list().subscribe({
      next: (movies) => {
        // Convertir le format backend → format TMDB
        const formatted = movies.map(m => ({
          id: m.tmdbId,
          title: m.title,
          poster_path: m.posterPath,
          vote_average: m.voteAverage,
          release_date: m.releaseDate,
          overview: m.overview,
        }));
        this.movies.set(formatted);
        this.loading.set(false);
      },
      error: () => {
        this.movies.set([]);
        this.loading.set(false);
      }
    });
  }

  switchTab(tab: 'popular' | 'catalog') {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.query.set('');

    if (tab === 'popular') {
      this.loadPopular();
    } else {
      this.loadCatalog();
    }
  }

  // ============ FAVORIS ============
  isFavorite(id: number): boolean {
    const user = this.auth.currentUser();
    return !!user && user.favorites.includes(id);
  }

  toggleFavorite(movie: any, event?: Event) {
    if (event) event.stopPropagation();

    const user = this.auth.currentUser();
    if (!user) return;

    const add = !user.favorites.includes(movie.id);
    const request$ = add
      ? this.users.addFavorite(movie.id)
      : this.users.removeFavorite(movie.id);

    request$.subscribe({
      next: (res: any) => {
        const updated = { ...user, favorites: res.favorites };
        localStorage.setItem('user', JSON.stringify(updated));
        this.auth.currentUser.set(updated);
      },
      error: (err) => console.error('Erreur favori:', err)
    });
  }
}
