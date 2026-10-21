import type { ReactNode } from 'react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Navigate, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Tabs from './pages/Tabs';
import Admin from './pages/Admin';

export function ProtectedRoute({
  children,
  admin = false
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { user } = useAuth();
  if (!user || !user.active) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/tabs/home" replace />;
  return children;
}

export default function App() {
  return (
    <IonApp>
      <ErrorBoundary>
        <AuthProvider>
          <IonReactRouter>
            <IonRouterOutlet>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/tabs/*"
                element={
                  <ProtectedRoute>
                    <Tabs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute admin>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </IonRouterOutlet>
          </IonReactRouter>
        </AuthProvider>
      </ErrorBoundary>
    </IonApp>
  );
}
