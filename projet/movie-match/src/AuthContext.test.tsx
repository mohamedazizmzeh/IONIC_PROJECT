import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import type { AppUser } from './types';

const user: AppUser = {
  id: 'u1',
  firstName: 'Lina',
  lastName: 'Test',
  age: 22,
  email: 'lina@example.com',
  photo: 'data:image/jpeg;base64,photo',
  role: 'user',
  active: true,
  favorites: []
};
function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
function session() {
  localStorage.setItem('token', 'existing-token');
  localStorage.setItem('user', JSON.stringify(user));
}
function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status });
}
function deferred() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it('reuses an Angular session and clears only session keys on logout', async () => {
  session();
  localStorage.setItem('other', 'keep');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(user)));
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.user?.firstName).toBe('Lina'));
  act(() => result.current.logout());
  expect(result.current.user).toBeNull();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('other')).toBe('keep');
});

it('stores a successful login with the same API payload and storage keys', async () => {
  const fetch = vi.fn().mockResolvedValue(response({ user, token: 'new-token' }));
  vi.stubGlobal('fetch', fetch);
  const { result } = renderHook(useAuth, { wrapper });
  await act(() => result.current.login(user.email, 'password'));
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    email: user.email,
    password: 'password'
  });
  expect(localStorage.getItem('token')).toBe('new-token');
  expect(result.current.user).toEqual(user);
});

it('optimistically merges concurrent favorites even when responses arrive out of order', async () => {
  session();
  const first = deferred();
  const second = deferred();
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(response(user))
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  vi.stubGlobal('fetch', fetch);
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  let firstRequest!: Promise<void>;
  let secondRequest!: Promise<void>;
  act(() => {
    firstRequest = result.current.toggleFavorite(1);
    secondRequest = result.current.toggleFavorite(2);
  });
  expect(result.current.user?.favorites).toEqual([1, 2]);
  await act(async () => {
    second.resolve(response({ favorites: [1, 2] }));
    await secondRequest;
  });
  await act(async () => {
    first.resolve(response({ favorites: [1] }));
    await firstRequest;
  });
  expect(result.current.user?.favorites).toEqual([1, 2]);
});

it('suppresses duplicate clicks and rolls back only the failed favorite', async () => {
  session();
  const first = deferred();
  const second = deferred();
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(response(user))
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  vi.stubGlobal('fetch', fetch);
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  let firstRequest!: Promise<void>;
  let secondRequest!: Promise<void>;
  act(() => {
    firstRequest = result.current.toggleFavorite(1).catch(() => {});
    secondRequest = result.current.toggleFavorite(2);
    void result.current.toggleFavorite(1);
  });
  expect(fetch).toHaveBeenCalledTimes(3);
  await act(async () => {
    second.resolve(response({ favorites: [1, 2] }));
    await secondRequest;
    first.resolve(response({ message: 'Offline' }, 500));
    await firstRequest;
  });
  expect(result.current.user?.favorites).toEqual([2]);
  expect(result.current.pendingFavorites).toEqual([]);
});

it('does not let a delayed refresh overwrite a new favorite', async () => {
  session();
  const refresh = deferred();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockReturnValueOnce(refresh.promise)
      .mockResolvedValue(response({ favorites: [9] }))
  );
  const { result } = renderHook(useAuth, { wrapper });
  await act(() => result.current.toggleFavorite(9));
  await act(async () => {
    refresh.resolve(response(user));
  });
  expect(result.current.user?.favorites).toEqual([9]);
});

it('clears an expired or disabled session while preserving an offline session', async () => {
  session();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ message: 'Disabled' }, 403)));
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.user).toBeNull());
  expect(localStorage.getItem('token')).toBeNull();
});

it('handles malformed saved user data without crashing', () => {
  localStorage.setItem('token', 'old');
  localStorage.setItem('user', '{invalid');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  const { result } = renderHook(useAuth, { wrapper });
  expect(result.current.user).toBeNull();
});
