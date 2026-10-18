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
      <ion-title>À l’affiche</ion-title>
    </ion-toolbar>

    <!-- Toggle Populaires / Catalogue -->
    <div class="tabs">
      <button
        class="tab"
        [attr.aria-pressed]="activeTab() === 'popular'"
        [class.active]="activeTab() === 'popular'"
        (click)="switchTab('popular')">
        Populaires
      </button>
      <button
        class="tab"
        [class.active]="activeTab() === 'catalog'"
        [attr.aria-pressed]="activeTab() === 'catalog'"
        (click)="switchTab('catalog')">
        Le catalogue
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
          aria-label="Rechercher un film"
          placeholder="Rechercher un film..."
          debounce="600">
        </ion-searchbar>
      </ion-toolbar>
    }
  </ion-header>

  <ion-content><div class="page-intro"><h1>Trouve ton prochain coup de cœur.</h1><p>Explore les films du moment et garde ceux qui te ressemblent.</p></div>
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
                [attr.aria-label]="(isFavorite(movie.id) ? 'Retirer des favoris : ' : 'Ajouter aux favoris : ') + movie.title"
                [attr.aria-pressed]="isFavorite(movie.id)"
                [class.active]="isFavorite(movie.id)"
                (click)="toggleFavorite(movie, $event)">
                {{ isFavorite(movie.id) ? '♥' : '♡' }}
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
  styleUrls: ['./home.page.scss']
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
