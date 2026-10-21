import { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useAuth } from '../AuthContext';
import { loadFavoriteMovies } from '../lib/movies';
import type { Movie } from '../types';
import MovieGrid from '../components/MovieGrid';
import { Loading, RequestError } from '../components/Feedback';

export default function Favorites() {
  const { user } = useAuth();
  const ids = user?.favorites.join(',') ?? '';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadFavoriteMovies(ids ? ids.split(',').map(Number) : []).then((result) => {
      if (!active) return;
      setMovies(result.movies);
      setLoading(false);
      if (result.failed)
        setError('Certains favoris n’ont pas pu être chargés. Réessaie pour les récupérer.');
    });
    return () => {
      active = false;
    };
  }, [ids, retry]);
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ma collection</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="page-intro">
          <h1>Les films qui te ressemblent.</h1>
          <p>Tous tes coups de cœur, réunis au même endroit.</p>
        </div>
        <RequestError
          message={error || actionError}
          onRetry={() => {
            setActionError('');
            setRetry(retry + 1);
          }}
        />
        {loading ? (
          <Loading />
        ) : movies.length ? (
          <MovieGrid movies={movies} onError={setActionError} />
        ) : (
          !error && (
            <div className="empty-state">
              <div className="empty-icon">💔</div>
              <p>Aucun film dans tes favoris.</p>
              <p className="hint">
                Va dans <strong>Accueil</strong> et clique sur 🤍 pour en ajouter.
              </p>
            </div>
          )
        )}
      </IonContent>
    </IonPage>
  );
}
