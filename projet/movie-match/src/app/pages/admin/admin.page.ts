import { Component, OnInit, inject, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner,
  IonAvatar, IonBadge, IonButtons, IonBackButton,
  IonSearchbar
} from '@ionic/angular';
import { TmdbService } from '../../core/services/tmdb.service';
import { MovieService } from '../../core/services/movie.service';
import { UserService } from '../../core/services/user.service';
import { AppUser } from '../../core/models/user.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner,
    IonAvatar, IonBadge, IonButtons, IonBackButton,
    IonSearchbar
  ],
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-back-button defaultHref="/tabs/profile"></ion-back-button>
      </ion-buttons>
      <ion-title>⚙️ Espace Admin</ion-title>
    </ion-toolbar>

    <!-- Onglets internes -->
    <div class="tabs">
      <button
        class="tab"
        [class.active]="activeTab() === 'movies'"
        (click)="activeTab.set('movies')">
        🎬 Films
      </button>
      <button
        class="tab"
        [class.active]="activeTab() === 'users'"
        (click)="activeTab.set('users')">
        👥 Utilisateurs
        <span class="count">{{ users().length }}</span>
      </button>
    </div>
  </ion-header>

  <ion-content class="ion-padding">

    <!-- ==================== ONGLET FILMS ==================== -->
    @if (activeTab() === 'movies') {
      <div class="section-header">
        <h2>🎬 Ajouter un film au catalogue</h2>
        <p class="subtitle">
          Le film sera disponible pour tous les utilisateurs.
        </p>
      </div>

      <ion-searchbar
        [value]="searchQuery()"
        (ionChange)="onSearch($event)"
        placeholder="Chercher un film..."
        debounce="600">
      </ion-searchbar>

      @if (searching()) {
        <div class="loader">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      }

      @if (searchResults().length > 0) {
        <div class="results-list">
          @for (movie of searchResults(); track movie.id) {
            <div class="result-row">
              @if (movie.poster_path) {
                <img [src]="tmdb.poster(movie.poster_path)" class="result-poster" />
              } @else {
                <div class="result-poster no-poster">🎬</div>
              }
              <div class="result-info">
                <div class="result-title">{{ movie.title }}</div>
                <div class="result-meta">
                  {{ movie.release_date?.substring(0, 4) || 'N/A' }}
                  • ⭐ {{ movie.vote_average?.toFixed(1) || 'N/A' }}
                </div>
              </div>
              <button
                class="btn-add"
                [class.added]="addedIds().includes(movie.id)"
                [disabled]="addedIds().includes(movie.id)"
                (click)="addMovie(movie)">
                {{ addedIds().includes(movie.id) ? '✓ Ajouté' : '+ Ajouter' }}
              </button>
            </div>
          }
        </div>
      }

      @if (searchQuery() && !searching() && searchResults().length === 0) {
        <p class="empty">Aucun résultat pour "{{ searchQuery() }}"</p>
      }

      @if (!searchQuery()) {
        <div class="empty-state">
          <div class="empty-icon">🎬</div>
          <p>Recherche un film pour l'ajouter au catalogue.</p>
          <p class="hint">
            {{ addedIds().length }} film(s) déjà dans le catalogue
          </p>
        </div>
      }
    }

    <!-- ==================== ONGLET UTILISATEURS ==================== -->
    @if (activeTab() === 'users') {
      <div class="section-header">
        <h2>👥 Gestion des utilisateurs</h2>
        <p class="subtitle">
          Désactiver un compte l'empêche de se connecter (sans le supprimer).
        </p>
      </div>

      @if (loadingUsers()) {
        <div class="loader">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (users().length === 0) {
        <p class="empty">Aucun utilisateur</p>
      } @else {
        <div class="users-list">
          @for (user of users(); track user.id) {
            <div class="user-row" [class.inactive]="!user.active">
              <ion-avatar style="width: 48px; height: 48px;">
                <img [src]="user.photo" [alt]="user.firstName" />
              </ion-avatar>

              <div class="user-info">
                <div class="user-name">
                  {{ user.firstName }} {{ user.lastName }}
                  @if (user.role === 'admin') {
                    <span class="badge badge-admin">admin</span>
                  }
                  @if (!user.active) {
                    <span class="badge badge-inactive">inactif</span>
                  }
                </div>
                <div class="user-email">{{ user.email }}</div>
                <div class="user-meta">
                  {{ user.age }} ans • {{ user.favorites.length }} favori(s)
                </div>
              </div>

              <button
                class="btn-toggle"
                [class.btn-disable]="user.active"
                [class.btn-enable]="!user.active"
                (click)="toggleActive(user)">
                {{ user.active ? 'Désactiver' : 'Activer' }}
              </button>
            </div>
          }
        </div>
      }
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
      padding: 14px 8px;
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

    /* Section header */
    .section-header {
      margin-bottom: 12px;
    }
    .section-header h2 {
      margin: 0 0 4px;
      font-size: 18px;
    }
    .subtitle {
      margin: 0;
      font-size: 13px;
      color: #666;
    }

    /* Loader */
    .loader {
      text-align: center;
      padding: 30px;
    }

    /* Résultats de recherche films */
    .results-list {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .result-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-bottom: 1px solid #f0f0f0;
    }
    .result-row:last-child { border-bottom: none; }
    .result-poster {
      width: 44px;
      height: 66px;
      object-fit: cover;
      border-radius: 6px;
      background: #eee;
      flex-shrink: 0;
    }
    .result-poster.no-poster {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #ccc;
    }
    .result-info { flex: 1; min-width: 0; }
    .result-title {
      font-weight: 600;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .result-meta {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }

    /* Bouton Ajouter */
    .btn-add {
      padding: 8px 14px;
      background: #3880ff;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .btn-add:hover:not(:disabled) { background: #2d6fd9; }
    .btn-add:disabled { cursor: default; }
    .btn-add.added {
      background: #e8f5e9;
      color: #2e7d32;
    }

    /* Utilisateurs */
    .users-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .user-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      transition: opacity 0.2s;
    }
    .user-row.inactive {
      opacity: 0.55;
      background: #fafafa;
    }
    .user-info { flex: 1; min-width: 0; }
    .user-name {
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .user-email {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-meta {
      font-size: 11px;
      color: #999;
      margin-top: 2px;
    }

    /* Badges */
    .badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-admin {
      background: #eb445a;
      color: white;
    }
    .badge-inactive {
      background: #d0d0d0;
      color: #666;
    }

    /* Bouton toggle */
    .btn-toggle {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      color: white;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .btn-disable { background: #eb445a; }
    .btn-disable:hover { background: #cf3c4f; }
    .btn-enable { background: #2dd36f; }
    .btn-enable:hover { background: #28bd63; }

    /* Empty states */
    .empty {
      text-align: center;
      color: #999;
      padding: 30px;
      font-size: 14px;
    }
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }
    .empty-state .empty-icon {
      font-size: 60px;
      margin-bottom: 12px;
    }
    .empty-state .hint {
      font-size: 12px;
      color: #bbb;
      margin-top: 8px;
    }
  `]
})
export class AdminPage implements OnInit {
  tmdb = inject(TmdbService);
  private movies = inject(MovieService);
  private usersSrv = inject(UserService);

  // Onglet actif
  activeTab = signal<'movies' | 'users'>('movies');

  // État films
  searchQuery = signal('');
  searchResults = signal<any[]>([]);
  searching = signal(false);
  addedIds = signal<number[]>([]);

  // État utilisateurs
  users = signal<AppUser[]>([]);
  loadingUsers = signal(true);

  ngOnInit() {
    this.loadUsers();
    this.loadAddedMovies();
  }

  loadUsers() {
    this.loadingUsers.set(true);
    this.usersSrv.list().subscribe({
      next: (list) => {
        this.users.set(list);
        this.loadingUsers.set(false);
      },
      error: (err) => {
        console.error('Erreur users:', err);
        this.loadingUsers.set(false);
      }
    });
  }

  loadAddedMovies() {
    this.movies.list().subscribe({
      next: (list) => this.addedIds.set(list.map(m => m.tmdbId))
    });
  }

  onSearch(event: any) {
    const q = (event.detail?.value ?? '').trim();
    this.searchQuery.set(q);
    if (q.length < 2) { this.searchResults.set([]); return; }

    this.searching.set(true);
    this.tmdb.search(q).subscribe({
      next: (res) => {
        this.searchResults.set(res.slice(0, 10));
        this.searching.set(false);
      },
      error: () => this.searching.set(false)
    });
  }

  addMovie(movie: any) {
    this.movies.add({
      tmdbId: movie.id,
      title: movie.title,
      overview: movie.overview || '',
      posterPath: movie.poster_path || '',
      releaseDate: movie.release_date || '',
      voteAverage: movie.vote_average || 0,
    }).subscribe({
      next: () => {
        this.addedIds.update(list => [...list, movie.id]);
      },
      error: (err) => alert('Erreur : ' + (err.error?.message ?? 'Inconnu'))
    });
  }

  toggleActive(user: AppUser) {
    const action = user.active ? 'désactiver' : 'activer';
    if (!confirm(`${action} ${user.firstName} ${user.lastName} ?`)) return;

    this.usersSrv.toggleActive(user.id).subscribe({
      next: (res) => {
        this.users.update(list =>
          list.map(u => u.id === user.id ? { ...u, active: res.active } : u)
        );
      },
      error: (err) => console.error('Erreur toggle:', err)
    });
  }
}
