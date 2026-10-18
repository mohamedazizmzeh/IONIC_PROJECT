import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, shareReplay, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TmdbMovie {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string;
  vote_average?: number;
  overview?: string;
}

interface CachedRequest<T> { expires: number; request: Observable<T> }

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private http = inject(HttpClient);
  private base = environment.tmdb.baseUrl;
  private key = environment.tmdb.apiKey;

  private lists = new Map<string, CachedRequest<TmdbMovie[]>>();
  private details = new Map<string, CachedRequest<TmdbMovie>>();

  getPopular() {
    return this.cached(this.lists, 'popular', () =>
      this.http.get<{ results: TmdbMovie[] }>(`${this.base}/movie/popular`, {
        params: { api_key: this.key, language: 'fr-FR' }
      }).pipe(map(response => response.results))
    );
  }

  search(query: string) {
    const key = query.trim().toLowerCase();
    return this.cached(this.lists, `search:${key}`, () =>
      this.http.get<{ results: TmdbMovie[] }>(`${this.base}/search/movie`, {
        params: { api_key: this.key, query: query.trim(), language: 'fr-FR' }
      }).pipe(map(response => response.results))
    );
  }

  getById(id: number) {
    return this.cached(this.details, String(id), () =>
      this.http.get<TmdbMovie>(`${this.base}/movie/${id}`, {
        params: { api_key: this.key, language: 'fr-FR' }
      })
    );
  }

  private cached<T>(cache: Map<string, CachedRequest<T>>, key: string, load: () => Observable<T>): Observable<T> {
    const existing = cache.get(key);
    if (existing && existing.expires > Date.now()) return existing.request;
    const request = load().pipe(
      timeout(10000),
      catchError(error => {
        if (cache.get(key)?.request === request) cache.delete(key);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    cache.delete(key);
    cache.set(key, { expires: Date.now() + 10 * 60 * 1000, request });
    if (cache.size > 100) cache.delete(cache.keys().next().value!);
    return request;
  }

  poster(path: string): string {
    return path ? `${environment.tmdb.imageUrl}${path}` : '';
  }
}
