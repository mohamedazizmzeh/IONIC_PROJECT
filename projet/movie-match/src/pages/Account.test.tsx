import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import { ProtectedRoute } from '../App';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import Matches from './Matches';
import type { AppUser } from '../types';

const user: AppUser = {
  id: 'u1',
  firstName: 'Lina',
  lastName: 'Test',
  age: 22,
  email: 'lina@example.com',
  photo: 'data:image/jpeg;base64,photo',
  role: 'user',
  active: true,
  favorites: [1]
};
function saved(value = user) {
  localStorage.setItem('token', 'token');
  localStorage.setItem('user', JSON.stringify(value));
}
function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status });
}
function mount(element: React.ReactNode, path = '/') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={element} />
          <Route path="/login" element={<p>Login destination</p>} />
          <Route path="/tabs/home" element={<p>Home destination</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

it('redirects signed-out users to login', async () => {
  mount(
    <ProtectedRoute>
      <p>Private</p>
    </ProtectedRoute>
  );
  expect(await screen.findByText('Login destination')).toBeInTheDocument();
  expect(screen.queryByText('Private')).toBeNull();
});
it('keeps the admin page inaccessible to a normal account', async () => {
  saved();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(user)));
  mount(
    <ProtectedRoute admin>
      <p>Admin only</p>
    </ProtectedRoute>
  );
  expect(await screen.findByText('Home destination')).toBeInTheDocument();
  expect(screen.queryByText('Admin only')).toBeNull();
});
it('allows an administrator through the same guard', async () => {
  const admin = { ...user, role: 'admin' as const };
  saved(admin);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(admin)));
  mount(
    <ProtectedRoute admin>
      <p>Admin only</p>
    </ProtectedRoute>
  );
  expect(await screen.findByText('Admin only')).toBeInTheDocument();
});
it('keeps backend login errors visible and re-enables the form', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(response({ message: 'Identifiants incorrects' }, 401))
  );
  mount(<Login />);
  fireEvent.change(screen.getByLabelText('Adresse email'), { target: { value: user.email } });
  fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Identifiants incorrects');
  expect(screen.getByRole('button', { name: 'Se connecter' })).toBeEnabled();
});
it('requires a camera photo before registration and exposes no file picker', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const { container } = mount(<Register />);
  for (const [label, value] of [
    ['Prénom', 'Lina'],
    ['Nom', 'Test'],
    ['Âge', '22'],
    ['Adresse email', user.email],
    ['Mot de passe', 'password']
  ]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Prends une photo');
  expect(fetch).not.toHaveBeenCalled();
  expect(container.querySelector('input[type=file]')).toBeNull();
});
it('shows the existing favorite count and logs out to login', async () => {
  saved();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(user)));
  mount(<Profile />);
  expect(await screen.findByText('Lina Test')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Espace admin/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Se déconnecter/ }));
  expect(await screen.findByText('Login destination')).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
});
it('requests the unchanged strict matching threshold and preserves score precision', async () => {
  const fetch = vi.fn().mockResolvedValue(response([{ user, common: 4, score: 75.01 }]));
  vi.stubGlobal('fetch', fetch);
  mount(<Matches />);
  expect(await screen.findByText('75.01%')).toBeInTheDocument();
  expect(fetch.mock.calls[0][0]).toContain('/matches?threshold=75');
});
it('shows a retryable matching error rather than an empty result', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  mount(<Matches />);
  expect(await screen.findByRole('alert')).toHaveTextContent('temporairement indisponibles');
  await waitFor(() => expect(screen.queryByText(/Aucun match trouvé/)).toBeNull());
});
