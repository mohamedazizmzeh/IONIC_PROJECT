import { IonAvatar, IonBadge, IonContent, IonItem, IonLabel, IonList, IonPage } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <IonPage className="profile-page">
      <IonContent className="ion-padding">
        <div className="profile-wrap">
          {user && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <IonAvatar style={{ width: 120, height: 120, margin: '0 auto 16px' }}>
                  <img src={user.photo || undefined} alt="Photo de profil" />
                </IonAvatar>
                <h2 style={{ margin: 0 }}>
                  {user.firstName} {user.lastName}
                </h2>
                <p style={{ color: 'var(--mm-muted)', margin: '4px 0' }}>
                  {user.age} ans • {user.email}
                </p>
                <IonBadge color={user.role === 'admin' ? 'danger' : 'primary'}>
                  {user.role}
                </IonBadge>
              </div>
              <IonList>
                <IonItem>
                  <IonLabel>
                    <strong>Films en favoris</strong>
                  </IonLabel>
                  <IonBadge slot="end" color="medium">
                    {user.favorites.length}
                  </IonBadge>
                </IonItem>
              </IonList>
              {user.role === 'admin' && (
                <button type="button" className="btn-admin" onClick={() => navigate('/admin')}>
                  ⚙️ Espace admin
                </button>
              )}
              <button
                type="button"
                className="btn-logout"
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
              >
                🚪 Se déconnecter
              </button>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
