import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface Movie {
  _id?: string;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string;
  releaseDate: string;
  voteAverage: number;
  addedBy?: string;
}

@Injectable({ providedIn: 'root' })
export class MovieService {
  private api = inject(ApiService);
  list() { return this.api.get<Movie[]>('/movies'); }
  add(movie: Movie) { return this.api.post<Movie>('/movies', movie); }
  remove(tmdbId: number) { return this.api.delete<{ ok: boolean }>(`/movies/${tmdbId}`); }
}
