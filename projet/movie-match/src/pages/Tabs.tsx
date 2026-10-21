import { IonPage, IonRouterOutlet } from '@ionic/react';
import { Link, NavLink, Navigate, Route } from 'react-router-dom';
import Home from './Home';
import Favorites from './Favorites';
import Matches from './Matches';
import Profile from './Profile';

const links = [
  {
    path: 'home',
    label: 'Découvrir',
    icon: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
  },
  {
    path: 'favorites',
    label: 'Mes favoris',
    icon: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    )
  },
  {
    path: 'matches',
    label: 'Mes matchs',
    icon: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 5a5 5 0 0 1 3 5" />
      </>
    )
  },
  {
    path: 'profile',
    label: 'Mon profil',
    icon: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
      </>
    )
  }
];

export default function Tabs() {
  return (
    <IonPage className="app-shell">
      <div className="app-content">
        <IonRouterOutlet>
          <Route index element={<Navigate to="/tabs/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="matches" element={<Matches />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/tabs/home" replace />} />
        </IonRouterOutlet>
      </div>
      <nav className="tab-bar" aria-label="Navigation principale">
        <Link className="brand shell-brand" to="/tabs/home">
          <span className="brand-mark" aria-hidden="true">
            ▶
          </span>
          <span>
            movie match<span className="brand-dot">.</span>
          </span>
        </Link>
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={`/tabs/${link.path}`}
            className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {link.icon}
            </svg>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </IonPage>
  );
}
