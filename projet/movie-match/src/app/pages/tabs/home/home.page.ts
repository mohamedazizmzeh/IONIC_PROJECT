import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { Observable, Subscription, map } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar,
  IonSpinner, IonText
} from '@ionic/angular';
import { TmdbService, TmdbMovie } from '../../../core/services/tmdb.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { MovieService } from '../../../core/services/movie.service';
import { MovieSwipeComponent } from './movie-swipe.component';

interface SwipeChoice { index: number; movieId: number; addedFavorite: boolean }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSearchbar, IonSpinner, IonText, MovieSwipeComponent
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
  deckIndex = signal(0);
  saving = signal(false);
  announcement = signal('');
  currentMovie = computed<TmdbMovie | undefined>(() => this.movies()[this.deckIndex()]);
  nextMovie = computed<TmdbMovie | undefined>(() => this.movies()[this.deckIndex() + 1]);
  private history = signal<SwipeChoice[]>([]);
  private deckVersion = 0;
  canRewind = computed(() => {
    const last = this.history().at(-1);
    return !!last && !this.saving() && !this.loading() && !this.pendingFavorites().has(last.movieId);
  });
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
    this.resetDeck();
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

  decide(direction: 'like' | 'pass') {
    const movie = this.currentMovie();
    if (!movie || this.loading() || this.saving() || this.pendingFavorites().has(movie.id)) return;
    if (direction === 'like' && !this.auth.currentUser()) {
      this.error.set('Connecte-toi pour enregistrer tes favoris.');
      return;
    }
    const entry: SwipeChoice = {
      index: this.deckIndex(), movieId: movie.id,
      addedFavorite: direction === 'like' && !this.isFavorite(movie.id)
    };
    this.error.set('');
    this.history.update(history => [...history, entry]);
    this.deckIndex.update(index => index + 1);
    this.announcement.set(direction === 'like' ? `${movie.title} ajouté aux favoris.` : `${movie.title} passé.`);
    if (!entry.addedFavorite) return;
    const version = this.deckVersion;
    this.saving.set(true);
    this.users.addFavorite(movie.id).subscribe({
      complete: () => this.saving.set(false),
      error: () => {
        if (version === this.deckVersion) {
          this.history.update(history => history.filter(choice => choice !== entry));
          this.deckIndex.set(entry.index);
          this.error.set('Le favori n’a pas pu être enregistré. Le film est revenu pour réessayer.');
          this.announcement.set('Favori non enregistré.');
        }
        this.saving.set(false);
      }
    });
  }

  rewind() {
    if (!this.canRewind()) return;
    const entry = this.history().at(-1)!;
    this.history.update(history => history.slice(0, -1));
    this.deckIndex.set(entry.index);
    this.error.set('');
    this.announcement.set('Dernier choix annulé.');
    if (!entry.addedFavorite) return;
    const version = this.deckVersion;
    this.saving.set(true);
    this.users.removeFavorite(entry.movieId).subscribe({
      complete: () => this.saving.set(false),
      error: () => {
        if (version === this.deckVersion) {
          this.history.update(history => [...history, entry]);
          this.deckIndex.set(entry.index + 1);
          this.error.set('Impossible d’annuler ce favori. Réessaie avec le bouton retour.');
        }
        this.saving.set(false);
      }
    });
  }

  restartDeck() {
    if (this.saving()) return;
    this.resetDeck();
  }

  private resetDeck() {
    ++this.deckVersion;
    this.deckIndex.set(0);
    this.history.set([]);
    this.announcement.set('');
  }
}
