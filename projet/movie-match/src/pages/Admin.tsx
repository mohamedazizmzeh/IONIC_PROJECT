import { useEffect, useRef, useState } from 'react';
import {
  IonAvatar,
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { api, errorMessage } from '../lib/api';
import { getCatalog, poster, searchMovies } from '../lib/movies';
import type { AppUser, Movie } from '../types';
import { Loading, RequestError } from '../components/Feedback';

export default function Admin() {
  const [tab, setTab] = useState<'movies' | 'users'>('movies');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [addedIds, setAddedIds] = useState<number[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const pending = useRef(new Set<string>());
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoadingUsers(true);
    setError('');
    api<AppUser[]>('/users', { signal: controller.signal })
      .then((list) => {
        if (active) setUsers(list);
      })
      .catch(() => {
        if (active) setError('La liste des utilisateurs est temporairement indisponible.');
      })
      .finally(() => {
        if (active) setLoadingUsers(false);
      });
    getCatalog(controller.signal)
      .then((list) => {
        if (active) setAddedIds(list.map((movie) => movie.id));
      })
      .catch(() => {
        if (active)
          setError(
            'Le catalogue est temporairement indisponible. Réessaie dans quelques instants.'
          );
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setResults([]);
    if (query.trim().length < 2) {
      setSearching(false);
      return;
    }
    setSearching(true);
    searchMovies(query)
      .then((list) => {
        if (active) setResults(list.slice(0, 10));
      })
      .catch(() => {
        if (active) setError('La recherche est temporairement indisponible. Réessaie.');
      })
      .finally(() => {
        if (active) setSearching(false);
      });
    return () => {
      active = false;
    };
  }, [query, retry]);
  function begin(id: string) {
    if (pending.current.has(id)) return false;
    pending.current.add(id);
    setPendingIds([...pending.current]);
    return true;
  }
  function finish(id: string) {
    pending.current.delete(id);
    setPendingIds([...pending.current]);
  }
  async function add(movie: Movie) {
    const key = `movie:${movie.id}`;
    if (addedIds.includes(movie.id) || !begin(key)) return;
    setError('');
    try {
      await api('/movies', {
        method: 'POST',
        body: JSON.stringify({
          tmdbId: movie.id,
          title: movie.title,
          overview: movie.overview || '',
          posterPath: movie.poster_path || '',
          releaseDate: movie.release_date || '',
          voteAverage: movie.vote_average || 0
        })
      });
      setAddedIds((ids) => [...new Set([...ids, movie.id])]);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      finish(key);
    }
  }
  async function toggleActive(user: AppUser) {
    if (
      pending.current.has(user.id) ||
      !window.confirm(
        `${user.active ? 'désactiver' : 'activer'} ${user.firstName} ${user.lastName} ?`
      ) ||
      !begin(user.id)
    )
      return;
    setError('');
    try {
      const result = await api<{ id: string; active: boolean }>(`/users/${user.id}/toggle-active`, {
        method: 'PATCH'
      });
      setUsers((list) =>
        list.map((item) => (item.id === user.id ? { ...item, active: result.active } : item))
      );
    } catch {
      setError('Le compte n’a pas pu être modifié. Réessaie.');
    } finally {
      finish(user.id);
    }
  }
  return (
    <IonPage className="admin-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
          <IonTitle>⚙️ Espace Admin</IonTitle>
        </IonToolbar>
        <div className="tabs">
          <button
            type="button"
            className={`tab${tab === 'movies' ? ' active' : ''}`}
            aria-pressed={tab === 'movies'}
            onClick={() => setTab('movies')}
          >
            🎬 Films
          </button>
          <button
            type="button"
            className={`tab${tab === 'users' ? ' active' : ''}`}
            aria-pressed={tab === 'users'}
            onClick={() => setTab('users')}
          >
            👥 Utilisateurs <span className="count">{users.length}</span>
          </button>
        </div>
      </IonHeader>
      <IonContent className="ion-padding">
        <RequestError message={error} onRetry={() => setRetry(retry + 1)} />
        {tab === 'movies' ? (
          <>
            <div className="section-header">
              <h2>🎬 Ajouter un film au catalogue</h2>
              <p className="subtitle">Le film sera disponible pour tous les utilisateurs.</p>
            </div>
            <IonSearchbar
              value={query}
              onIonInput={(e) => setQuery(e.detail.value ?? '')}
              aria-label="Chercher un film"
              placeholder="Chercher un film..."
              debounce={300}
            />
            {searching && <Loading />}
            <div className="results-list">
              {results.map((movie) => (
                <div className="result-row" key={movie.id}>
                  {movie.poster_path ? (
                    <img
                      src={poster(movie.poster_path)}
                      className="result-poster"
                      alt={movie.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="result-poster no-poster">🎬</div>
                  )}
                  <div className="result-info">
                    <div className="result-title">{movie.title}</div>
                    <div className="result-meta">
                      {movie.release_date?.substring(0, 4) || 'N/A'} • ⭐{' '}
                      {movie.vote_average?.toFixed(1) ?? 'N/A'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn-add${addedIds.includes(movie.id) ? ' added' : ''}`}
                    disabled={
                      addedIds.includes(movie.id) || pendingIds.includes(`movie:${movie.id}`)
                    }
                    onClick={() => add(movie)}
                  >
                    {addedIds.includes(movie.id) ? '✓ Ajouté' : '+ Ajouter'}
                  </button>
                </div>
              ))}
            </div>
            {query && !searching && !error && results.length === 0 && (
              <p className="empty">Aucun résultat pour « {query} »</p>
            )}
            {!query && (
              <div className="empty-state">
                <div className="empty-icon">🎬</div>
                <p>Recherche un film pour l’ajouter au catalogue.</p>
                <p className="hint">{addedIds.length} film(s) déjà dans le catalogue</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="section-header">
              <h2>👥 Gestion des utilisateurs</h2>
              <p className="subtitle">
                Désactiver un compte l’empêche de se connecter (sans le supprimer).
              </p>
            </div>
            {loadingUsers ? (
              <Loading />
            ) : users.length === 0 ? (
              !error && <p className="empty">Aucun utilisateur</p>
            ) : (
              <div className="users-list">
                {users.map((user) => (
                  <div className={`user-row${user.active ? '' : ' inactive'}`} key={user.id}>
                    <IonAvatar style={{ width: 48, height: 48 }}>
                      <img src={user.photo || undefined} alt={user.firstName} />
                    </IonAvatar>
                    <div className="user-info">
                      <div className="user-name">
                        {user.firstName} {user.lastName}{' '}
                        {user.role === 'admin' && <span className="badge badge-admin">admin</span>}{' '}
                        {!user.active && <span className="badge badge-inactive">inactif</span>}
                      </div>
                      <div className="user-email">{user.email}</div>
                      <div className="user-meta">
                        {user.age} ans • {user.favorites.length} favori(s)
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`btn-toggle ${user.active ? 'btn-disable' : 'btn-enable'}`}
                      disabled={pendingIds.includes(user.id)}
                      onClick={() => toggleActive(user)}
                    >
                      {user.active ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
