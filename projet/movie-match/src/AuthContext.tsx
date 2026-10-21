import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppUser, AuthResponse, RegisterData } from './types';
import { api, ApiError } from './lib/api';

interface AuthContextValue {
  user: AppUser | null;
  pendingFavorites: number[];
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  toggleFavorite: (id: number) => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

function storedUser(): AppUser | null {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return localStorage.getItem('token') && user?.id && Array.isArray(user.favorites) ? user : null;
  } catch {
    return null;
  }
}

function persistUser(user: AppUser | null) {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(storedUser);
  const userRef = useRef(user);
  const pending = useRef(new Set<number>());
  const [pendingFavorites, setPendingFavorites] = useState<number[]>([]);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    const controller = new AbortController();
    const initialUser = userRef.current;
    api<AppUser>('/auth/me', { signal: controller.signal })
      .then((freshUser) => {
        // A delayed refresh must not overwrite a newer login or favorite change.
        if (userRef.current !== initialUser) return;
        userRef.current = freshUser;
        persistUser(freshUser);
        setUser(freshUser);
      })
      .catch((error) => {
        if (
          error instanceof ApiError &&
          [401, 403].includes(error.status) &&
          userRef.current === initialUser
        ) {
          localStorage.removeItem('token');
          persistUser(null);
          userRef.current = null;
          setUser(null);
        }
      });
    return () => controller.abort();
  }, []);

  function saveSession(session: AuthResponse) {
    localStorage.setItem('token', session.token);
    persistUser(session.user);
    userRef.current = session.user;
    setUser(session.user);
  }

  async function login(email: string, password: string) {
    saveSession(
      await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
    );
  }

  async function register(data: RegisterData) {
    saveSession(
      await api<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) })
    );
  }

  function logout() {
    localStorage.removeItem('token');
    persistUser(null);
    userRef.current = null;
    setUser(null);
  }

  function updateFavorite(userId: string, id: number, add: boolean) {
    const current = userRef.current;
    if (!current || current.id !== userId) return;
    const favorites = new Set(current.favorites);
    if (add) favorites.add(id);
    else favorites.delete(id);
    const updated = { ...current, favorites: [...favorites] };
    userRef.current = updated;
    persistUser(updated);
    setUser(updated);
  }

  async function toggleFavorite(id: number) {
    const current = userRef.current;
    if (!current || pending.current.has(id)) return;
    const wasFavorite = current.favorites.includes(id);
    pending.current.add(id);
    setPendingFavorites([...pending.current]);
    updateFavorite(current.id, id, !wasFavorite);
    try {
      await api(`/users/favorites/${id}`, {
        method: wasFavorite ? 'DELETE' : 'POST',
        ...(wasFavorite ? {} : { body: '{}' })
      });
    } catch (error) {
      updateFavorite(current.id, id, wasFavorite);
      throw error;
    } finally {
      pending.current.delete(id);
      setPendingFavorites([...pending.current]);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, pendingFavorites, login, register, logout, toggleFavorite }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider est requis.');
  return context;
}
