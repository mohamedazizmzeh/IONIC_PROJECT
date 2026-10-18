import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, catchError, defer, finalize, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { AppUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  pendingFavorites = signal<ReadonlySet<number>>(new Set());

  list() { return this.api.get<AppUser[]>('/users'); }
  toggleActive(id: string) { return this.api.patch<{ id: string; active: boolean }>(`/users/${id}/toggle-active`); }
  addFavorite(movieId: number) { return this.changeFavorite(movieId, true); }
  removeFavorite(movieId: number) { return this.changeFavorite(movieId, false); }

  private changeFavorite(movieId: number, add: boolean) {
    return defer(() => {
      const user = this.auth.currentUser();
      if (!user || this.pendingFavorites().has(movieId)) return EMPTY;
      const wasFavorite = user.favorites.includes(movieId);
      this.pendingFavorites.update(ids => new Set([...ids, movieId]));
      this.updateFavorite(user.id, movieId, add);
      const request = add
        ? this.api.post<{ favorites: number[] }>(`/users/favorites/${movieId}`, {})
        : this.api.delete<{ favorites: number[] }>(`/users/favorites/${movieId}`);
      return request.pipe(
        catchError(error => {
          this.updateFavorite(user.id, movieId, wasFavorite);
          return throwError(() => error);
        }),
        finalize(() => this.pendingFavorites.update(ids => {
          const remaining = new Set(ids);
          remaining.delete(movieId);
          return remaining;
        }))
      );
    });
  }

  private updateFavorite(userId: string, movieId: number, add: boolean) {
    const user = this.auth.currentUser();
    if (!user || user.id !== userId) return;
    const favorites = new Set(user.favorites);
    if (add) favorites.add(movieId);
    else favorites.delete(movieId);
    const updated = { ...user, favorites: [...favorites] };
    localStorage.setItem('user', JSON.stringify(updated));
    this.auth.currentUser.set(updated);
  }
}
