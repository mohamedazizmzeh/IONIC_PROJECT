import { useState } from 'react';
import type { FormEvent } from 'react';
import { IonSpinner } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import CameraCapture from '../components/CameraCapture';
import { useAuth } from '../AuthContext';
import { errorMessage } from '../lib/api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    age: '',
    email: '',
    password: ''
  });
  const [photo, setPhoto] = useState('');
  const [cameraBusy, setCameraBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  function field(name: keyof typeof fields) {
    return {
      name,
      value: fields[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setFields({ ...fields, [name]: event.target.value })
    };
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading || cameraBusy) return;
    if (
      !fields.firstName.trim() ||
      !fields.lastName.trim() ||
      !fields.email.trim() ||
      !fields.password ||
      !Number.isInteger(Number(fields.age)) ||
      Number(fields.age) < 1
    ) {
      setError('Merci de remplir tous les champs avec un âge valide.');
      return;
    }
    if (!photo) {
      setError('Prends une photo avec ta caméra pour créer ton compte.');
      return;
    }
    if (photo.length > 900000) {
      setError('La photo est trop volumineuse. Reprends une photo.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({
        ...fields,
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        email: fields.email.trim(),
        age: Number(fields.age),
        photo
      });
      navigate('/tabs/home', { replace: true });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthLayout register>
      <form className="auth-form register-form" onSubmit={submit}>
        <div className="eyebrow">Bienvenue dans la salle</div>
        <h1>Ta place t’attend.</h1>
        <p className="auth-description">Crée ton profil et trouve tes affinités cinéma.</p>
        <div className="field-row">
          <label className="field">
            Prénom
            <input
              {...field('firstName')}
              autoComplete="given-name"
              placeholder="Ton prénom"
              required
            />
          </label>
          <label className="field">
            Nom
            <input
              {...field('lastName')}
              autoComplete="family-name"
              placeholder="Ton nom"
              required
            />
          </label>
        </div>
        <label className="field">
          Âge
          <input {...field('age')} type="number" placeholder="Ton âge" required />
        </label>
        <label className="field">
          Adresse email
          <input
            {...field('email')}
            type="email"
            autoComplete="email"
            placeholder="toi@exemple.com"
            required
          />
        </label>
        <label className="field">
          Mot de passe
          <input
            {...field('password')}
            type="password"
            autoComplete="new-password"
            placeholder="Choisis un mot de passe"
            required
          />
        </label>
        <CameraCapture
          photo={photo}
          onPhoto={setPhoto}
          onError={setError}
          disabled={loading}
          onBusyChange={setCameraBusy}
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="auth-submit"
          type="submit"
          disabled={loading || cameraBusy}
          aria-busy={loading}
        >
          {loading ? (
            <IonSpinner name="crescent" aria-label="Inscription en cours" />
          ) : (
            <>
              <span>Créer mon compte</span>
              <span aria-hidden="true">↗</span>
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
