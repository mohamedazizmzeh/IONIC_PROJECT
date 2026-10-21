import { environment } from '../environments/environment';
import type { CatalogMovie, Movie } from '../types';
import { api, requestJson } from './api';

interface CacheEntry<T> {
  expires: number;
  promise: Promise<T>;
}
const lists = new Map<string, CacheEntry<Movie[]>>();
const details = new Map<string, CacheEntry<Movie>>();

function cached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  load: () => Promise<T>
): Promise<T> {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.promise;
  const promise = load().catch((error) => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
    throw error;
  });
  cache.delete(key);
  cache.set(key, { expires: Date.now() + 10 * 60 * 1000, promise });
  if (cache.size > 100) cache.delete(cache.keys().next().value!);
  return promise;
}

function movieUrl(path: string, query?: string) {
  const params = new URLSearchParams({
    api_key: import.meta.env.VITE_TMDB_API_KEY || environment.tmdb.apiKey,
    language: 'fr-FR'
  });
  if (query) params.set('query', query.trim());
  return `${environment.tmdb.baseUrl}${path}?${params}`;
}

export function getPopular() {
  return cached(
    lists,
    'popular',
    async () => (await requestJson<{ results: Movie[] }>(movieUrl('/movie/popular'))).results
  );
}

export function searchMovies(query: string) {
  return cached(
    lists,
    `search:${query.trim().toLowerCase()}`,
    async () => (await requestJson<{ results: Movie[] }>(movieUrl('/search/movie', query))).results
  );
}

export function getMovie(id: number) {
  return cached(details, String(id), () => requestJson<Movie>(movieUrl(`/movie/${id}`)));
}

export function poster(path?: string | null) {
  return path ? `${environment.tmdb.imageUrl}${path}` : '';
}

export async function getCatalog(signal?: AbortSignal): Promise<Movie[]> {
  const movies = await api<CatalogMovie[]>('/movies', { signal });
  return movies.map((movie) => ({
    id: movie.tmdbId,
    title: movie.title,
    poster_path: movie.posterPath,
    vote_average: movie.voteAverage,
    release_date: movie.releaseDate,
    overview: movie.overview
  }));
}

export async function loadFavoriteMovies(favorites: number[]) {
  const ids = [...new Set(favorites)];
  const results: (Movie | null)[] = new Array(ids.length).fill(null);
  let failed = false;
  let next = 0;
  // Keep four requests running, starting the next film as soon as a slot is free.
  async function loadNext() {
    while (next < ids.length) {
      const index = next++;
      try {
        results[index] = await getMovie(ids[index]);
      } catch {
        failed = true;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, ids.length) }, loadNext));
  return { movies: results.filter((movie): movie is Movie => movie !== null), failed };
}

export function clearMovieCache() {
  lists.clear();
  details.clear();
}
