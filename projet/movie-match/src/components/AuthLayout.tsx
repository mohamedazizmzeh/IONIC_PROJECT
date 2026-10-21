import type { ReactNode } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { Link } from 'react-router-dom';

export function Brand({ className = 'brand' }: { className?: string }) {
  return (
    <Link className={className} to="/login" aria-label="Movie Match, accueil">
      <span className="brand-mark" aria-hidden="true">
        ▶
      </span>
      <span>
        movie match<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export default function AuthLayout({
  children,
  register = false
}: {
  children: ReactNode;
  register?: boolean;
}) {
  return (
    <IonPage>
      <IonContent className="auth-page">
        <div className="auth-layout">
          <aside className="cinema-panel">
            <Brand />
            <div className="cinema-story">
              <div className="eyebrow">Le cinéma, ça se partage</div>
              <h2>
                Un bon film.
                <br />
                Une belle
                <br />
                <em>rencontre.</em>
              </h2>
              <p>Retrouve tes films préférés et les personnes qui les aiment autant que toi.</p>
              <div className="ticket-stack" aria-hidden="true">
                <div className="cinema-ticket back">
                  <div className="ticket-top">
                    <span>MOVIE MATCH</span>
                    <span>02</span>
                  </div>
                  <div className="ticket-title">Même passion.</div>
                  <div className="ticket-bottom">
                    <span>UNE HISTOIRE À PARTAGER</span>
                    <span>ADMIT ONE</span>
                  </div>
                </div>
                <div className="cinema-ticket">
                  <div className="ticket-top">
                    <span>MOVIE MATCH</span>
                    <span>01</span>
                  </div>
                  <div className="ticket-title">Même séance.</div>
                  <div className="ticket-bottom">
                    <span>LE DÉBUT D’UNE BELLE HISTOIRE</span>
                    <span>ADMIT ONE</span>
                  </div>
                </div>
                <div className="ticket-seal">✳</div>
              </div>
            </div>
            <div className="cinema-footer">
              <span>DES FILMS. DES AFFINITÉS. DES RENCONTRES.</span>
              <span>EST. 2026</span>
            </div>
          </aside>
          <main className="auth-panel">
            <Brand className="brand mobile-brand" />
            <div className="auth-topline">
              {register ? (
                <>
                  Déjà dans la salle ? <Link to="/login">Connecte-toi ↗</Link>
                </>
              ) : (
                <>
                  Pas encore de compte ? <Link to="/register">Rejoins-nous ↗</Link>
                </>
              )}
            </div>
            {children}
            <footer className="auth-footer">
              {register ? (
                'Collectionne les films. Partage la passion.'
              ) : (
                <>
                  Un espace pour les amoureux du cinéma.
                  <br />À chaque film, de nouvelles affinités.
                </>
              )}
            </footer>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
}
