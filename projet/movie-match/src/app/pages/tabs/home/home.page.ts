import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Observable, Subscription, map } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar,
  IonSpinner, IonText
} from '@ionic/angular';
import { TmdbService, TmdbMovie } from '../../../core/services/tmdb.service';
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
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  tmdb = inject(TmdbService);
  private users = inject(UserService);
  pendingFavorites = this.users.pendingFavorites;
  private auth = inject(AuthService);
  private movieSrv = inject(MovieService);

  // État
  activeTab = signal<'popular' | 'catalog'>('popular');
  movies = signal<TmdbMovie[]>([]);
  loading = signal(false);
  query = signal('');
  catalogCount = signal(0);
  error = signal('');
  private movieRequest?: Subscription;
  private countRequest?: Subscription;

  ngOnInit() {
    this.loadPopular();
    this.loadCatalogCount();
  }

  // ============ POPULAIRES (TMDB) ============
  loadPopular() {
    this.loadMovies(this.tmdb.getPopular());
  }

  private loadMovies(source: Observable<TmdbMovie[]>) {
    this.movieRequest?.unsubscribe();
    this.movies.set([]);
    this.loading.set(true);
    this.error.set('');
    this.movieRequest = source.subscribe({
      next: (movies) => {
        this.movies.set(movies);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Les films sont temporairement indisponibles. Vérifie ta connexion et réessaie.');
        this.loading.set(false);
      }
    });
  }

  onSearch(event: any) {
    if (this.activeTab() !== 'popular') return;
    const q = (event.detail?.value ?? '').trim();
    this.query.set(q);

    if (q.length < 2) {
      this.loadPopular();
      return;
    }
    this.loadMovies(this.tmdb.search(q));
  }

  // ============ CATALOGUE (Admin) ============
  loadCatalogCount() {
    this.countRequest = this.movieSrv.list().subscribe({
      next: (list) => this.catalogCount.set(list.length),
      error: () => this.catalogCount.set(0)
    });
  }

  loadCatalog() {
    this.loadMovies(this.movieSrv.list().pipe(
      map(movies => movies.map(m => ({
          id: m.tmdbId,
          title: m.title,
          poster_path: m.posterPath,
          vote_average: m.voteAverage,
          release_date: m.releaseDate,
          overview: m.overview,
      })))
    ));
  }

  retry() {
    if (this.activeTab() === 'catalog') this.loadCatalog();
    else this.onSearch({ detail: { value: this.query() } });
  }

  ngOnDestroy() {
    this.movieRequest?.unsubscribe();
    this.countRequest?.unsubscribe();
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

  toggleFavorite(movie: TmdbMovie) {
    const user = this.auth.currentUser();
    if (!user || this.pendingFavorites().has(movie.id)) return;
    this.error.set('');
    const request = user.favorites.includes(movie.id)
      ? this.users.removeFavorite(movie.id)
      : this.users.addFavorite(movie.id);
    request.subscribe({
      error: () => this.error.set('La modification des favoris a échoué. Ton choix précédent a été conservé. Réessaie.')
    });
  }
}
