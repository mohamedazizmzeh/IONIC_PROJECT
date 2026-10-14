import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AppUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = inject(ApiService);

  list() { return this.api.get<AppUser[]>('/users'); }
  toggleActive(id: string) { return this.api.patch<{ id: string; active: boolean }>(`/users/${id}/toggle-active`); }
  addFavorite(movieId: number) { return this.api.post<{ favorites: number[] }>(`/users/favorites/${movieId}`, {}); }
  removeFavorite(movieId: number) { return this.api.delete<{ favorites: number[] }>(`/users/favorites/${movieId}`); }
}
