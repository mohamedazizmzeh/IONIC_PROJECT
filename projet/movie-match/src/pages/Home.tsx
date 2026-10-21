import { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonSearchbar, IonTitle, IonToolbar } from '@ionic/react';
import { getCatalog, getPopular, searchMovies } from '../lib/movies';
import type { Movie } from '../types';
import MovieGrid from '../components/MovieGrid';
import { Loading, RequestError } from '../components/Feedback';

export default function Home() {
  const [tab, setTab] = useState<'popular' | 'catalog'>('popular');
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [catalogCount, setCatalogCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getCatalog(controller.signal)
      .then((movies) => setCatalogCount(movies.length))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setMovies([]);
    const request =
      tab === 'catalog'
        ? getCatalog(controller.signal)
        : query.trim()
          ? searchMovies(query)
          : getPopular();
    request
      .then((movies) => {
        if (active) {
          setMovies(movies);
          if (tab === 'catalog') setCatalogCount(movies.length);
        }
      })
      .catch(() => {
        if (active)
          setError('Les films sont temporairement indisponibles. Réessaie dans quelques instants.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [tab, query, retry]);
  return (
    <IonPage className="home-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>À l’affiche</IonTitle>
        </IonToolbar>
        <div className="tabs">
          <button
            type="button"
            className={`tab${tab === 'popular' ? ' active' : ''}`}
            aria-pressed={tab === 'popular'}
            onClick={() => setTab('popular')}
          >
            Populaires
          </button>
          <button
            type="button"
            className={`tab${tab === 'catalog' ? ' active' : ''}`}
            aria-pressed={tab === 'catalog'}
            onClick={() => setTab('catalog')}
          >
            Le catalogue {catalogCount > 0 && <span className="count">{catalogCount}</span>}
          </button>
        </div>
        {tab === 'popular' && (
          <IonToolbar>
            <IonSearchbar
              value={query}
              onIonInput={(e) => setQuery(e.detail.value ?? '')}
              aria-label="Rechercher un film"
              placeholder="Rechercher un film..."
              debounce={300}
            />
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent>
        <div className="page-intro">
          <h1>Trouve ton prochain coup de cœur.</h1>
          <p>Explore les films du moment et garde ceux qui te ressemblent.</p>
        </div>
        <RequestError
          message={error || actionError}
          onRetry={() => {
            setActionError('');
            setRetry(retry + 1);
          }}
        />
        {loading ? (
          <Loading text="Chargement des affiches…" />
        ) : movies.length ? (
          <MovieGrid movies={movies} onError={setActionError} />
        ) : (
          !error && (
            <div className="empty-state">
              {tab === 'catalog' ? (
                <>
                  <p>Catalogue vide</p>
                  <p className="hint">Aucun film n’a encore été ajouté par l’administrateur.</p>
                </>
              ) : (
                <p>{query ? `Aucun résultat pour « ${query} ».` : 'Aucun film disponible.'}</p>
              )}
            </div>
          )
        )}
      </IonContent>
    </IonPage>
  );
}
