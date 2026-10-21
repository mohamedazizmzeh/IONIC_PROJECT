import { useEffect, useState } from 'react';
import {
  IonAvatar,
  IonBadge,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { useAuth } from '../AuthContext';
import { api } from '../lib/api';
import type { MatchResult } from '../types';
import { Loading, RequestError } from '../components/Feedback';

export default function Matches() {
  const { user } = useAuth();
  const favorites = user?.favorites.join(',') ?? '';
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api<MatchResult[]>('/matches?threshold=75', { signal: controller.signal })
      .then((results) => {
        if (active) setMatches(results);
      })
      .catch(() => {
        if (active)
          setError(
            'Les matchs sont temporairement indisponibles. Réessaie dans quelques instants.'
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [favorites, retry]);
  return (
    <IonPage className="matches-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>👥 Mes matchs</IonTitle>
          <div slot="end" style={{ marginRight: 12, fontSize: 12, color: 'var(--mm-muted)' }}>
            Seuil &gt; 75%
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <RequestError message={error} onRetry={() => setRetry(retry + 1)} />
        {loading ? (
          <Loading text="Recherche de matchs..." />
        ) : (
          !error &&
          (matches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <p>Aucun match trouvé pour l’instant.</p>
              <p className="hint">
                Le taux de correspondance doit dépasser <strong>75%</strong> avec un autre
                utilisateur.
              </p>
              <p className="hint">
                Ajoute plus de films à tes favoris pour augmenter tes chances !
              </p>
            </div>
          ) : (
            <div style={{ padding: 12 }}>
              <p style={{ textAlign: 'center', color: 'var(--mm-muted)', fontSize: 13 }}>
                {matches.length} utilisateur(s) partagent tes goûts 🎬
              </p>
              {matches.map((match) => (
                <div className="match-card" key={match.user.id}>
                  <IonAvatar style={{ width: 60, height: 60 }}>
                    <img src={match.user.photo || undefined} alt={match.user.firstName} />
                  </IonAvatar>
                  <div className="match-info">
                    <div className="match-name">
                      {match.user.firstName} {match.user.lastName}
                    </div>
                    <div className="match-detail">
                      {match.common} film(s) en commun • {match.user.age} ans
                    </div>
                    <div className="match-progress">
                      <div className="match-progress-bar" style={{ width: `${match.score}%` }} />
                    </div>
                  </div>
                  <IonBadge
                    color={match.score >= 90 ? 'success' : 'primary'}
                    className="match-score"
                  >
                    {match.score.toFixed(2)}%
                  </IonBadge>
                </div>
              ))}
            </div>
          ))
        )}
      </IonContent>
    </IonPage>
  );
}
