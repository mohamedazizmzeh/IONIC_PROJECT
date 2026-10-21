import type { Movie } from '../types';
import { useAuth } from '../AuthContext';
import { poster } from '../lib/movies';

export default function MovieGrid({
  movies,
  onError
}: {
  movies: Movie[];
  onError: (error: string) => void;
}) {
  const { user, pendingFavorites, toggleFavorite } = useAuth();
  async function toggle(id: number) {
    onError('');
    try {
      await toggleFavorite(id);
    } catch {
      onError('Le favori n’a pas pu être modifié. Ton choix précédent a été conservé. Réessaie.');
    }
  }
  return (
    <div className="movies-grid">
      {movies.map((movie) => {
        const favorite = user?.favorites.includes(movie.id) ?? false;
        return (
          <article className="movie-card" key={movie.id}>
            <div className="poster-wrapper">
              <div className="no-poster" aria-hidden="true">
                🎬
              </div>
              {movie.poster_path && (
                <img
                  src={poster(movie.poster_path)}
                  alt={movie.title}
                  loading="lazy"
                  decoding="async"
                />
              )}
              <button
                type="button"
                className={`fav-btn${favorite ? ' active' : ''}`}
                aria-label={`${favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} : ${movie.title}`}
                aria-pressed={favorite}
                disabled={pendingFavorites.includes(movie.id)}
                onClick={() => toggle(movie.id)}
              >
                {favorite ? '♥' : '♡'}
              </button>
            </div>
            <div className="movie-info">
              <div className="movie-title">{movie.title}</div>
              <div className="movie-meta">
                ⭐ {movie.vote_average?.toFixed(1) ?? 'N/A'}
                {movie.release_date && ` · ${movie.release_date.substring(0, 4)}`}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
