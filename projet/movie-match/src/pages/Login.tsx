import { useState } from 'react';
import type { FormEvent } from 'react';
import { IonSpinner } from '@ionic/react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../AuthContext';
import { errorMessage } from '../lib/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (!email.trim() || !password) {
      setError('Merci de remplir tous les champs.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/tabs/home', { replace: true });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={submit}>
        <div className="eyebrow">Ton prochain coup de cœur</div>
        <h1>Content de te revoir.</h1>
        <p className="auth-description">
          Tes films, tes favoris et de belles affinités.
          <br />
          La suite de l’histoire commence ici.
        </p>
        <label className="field">
          Adresse email
          <input
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="toi@exemple.com"
            required
          />
        </label>
        <label className="field">
          Mot de passe
          <input
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Ton mot de passe"
            required
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="auth-submit" type="submit" disabled={loading} aria-busy={loading}>
          {loading ? (
            <IonSpinner name="crescent" aria-label="Connexion en cours" />
          ) : (
            <>
              <span>Se connecter</span>
              <span aria-hidden="true">↗</span>
            </>
          )}
        </button>
        <div className="auth-note">Le cinéma nous rapproche</div>
        <p className="auth-bottom">
          Une nouvelle histoire ? <Link to="/register">Créer mon compte</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
