import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private http = inject(HttpClient);
  private base = environment.tmdb.baseUrl;
  private key = environment.tmdb.apiKey;

  // ✅ CACHE persistant (survit aux changements d'onglet)
  private popularCache: any[] | null = null;
  private searchCache = new Map<string, any[]>();

  getPopular() {
    // Si déjà en cache → retour immédiat
    if (this.popularCache) {
      return of(this.popularCache);
    }
    return this.http.get<any>(`${this.base}/movie/popular`, {
      params: { api_key: this.key, language: 'fr-FR' }
    }).pipe(
      map(r => r.results),
      tap(results => this.popularCache = results)
    );
  }

  search(query: string) {
    const key = query.toLowerCase().trim();
    // Si déjà en cache → retour immédiat
    if (this.searchCache.has(key)) {
      return of(this.searchCache.get(key)!);
    }
    return this.http.get<any>(`${this.base}/search/movie`, {
      params: { api_key: this.key, query, language: 'fr-FR' }
    }).pipe(
      map(r => r.results),
      tap(results => this.searchCache.set(key, results))
    );
  }

  getById(id: number) {
    return this.http.get<any>(`${this.base}/movie/${id}`, {
      params: { api_key: this.key, language: 'fr-FR' }
    });
  }

  poster(path: string): string {
    return path ? `${environment.tmdb.imageUrl}${path}` : '';
  }
}
