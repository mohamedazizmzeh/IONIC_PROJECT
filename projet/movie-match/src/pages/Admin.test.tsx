import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Admin from './Admin';
import { clearMovieCache } from '../lib/movies';

const user = {
  id: 'u2',
  firstName: 'Sara',
  lastName: 'Test',
  age: 25,
  email: 'sara@example.com',
  photo: 'data:image/jpeg;base64,photo',
  active: true,
  role: 'user',
  favorites: []
};
function response(value: unknown) {
  return new Response(JSON.stringify(value));
}

it('adds a movie using the existing catalog payload', async () => {
  clearMovieCache();
  const fetch = vi
    .fn()
    .mockImplementation((url: string, options: RequestInit) =>
      Promise.resolve(
        response(
          options?.method === 'POST'
            ? {}
            : url.includes('/search/movie')
              ? {
                  results: [
                    {
                      id: 7,
                      title: 'Film test',
                      overview: 'Histoire',
                      poster_path: '/poster.jpg',
                      vote_average: 8.1,
                      release_date: '2026-01-01'
                    }
                  ]
                }
              : []
        )
      )
    );
  vi.stubGlobal('fetch', fetch);
  const { container } = render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>
  );
  const search = container.querySelector('ion-searchbar')!;
  await waitFor(() => expect(search).toHaveProperty('placeholder', 'Chercher un film...'));
  fireEvent(search, new CustomEvent('ionInput', { detail: { value: 'test' } }));
  fireEvent.click(await screen.findByRole('button', { name: '+ Ajouter' }));
  expect(await screen.findByRole('button', { name: '✓ Ajouté' })).toBeDisabled();
  const request = fetch.mock.calls.find(([, options]) => options.method === 'POST');
  expect(JSON.parse(request![1].body)).toEqual({
    tmdbId: 7,
    title: 'Film test',
    overview: 'Histoire',
    posterPath: '/poster.jpg',
    voteAverage: 8.1,
    releaseDate: '2026-01-01'
  });
});
it('deactivates accounts with PATCH, preserving the user row', async () => {
  const fetch = vi
    .fn()
    .mockImplementation((url: string, options: RequestInit) =>
      Promise.resolve(
        response(
          options.method === 'PATCH'
            ? { id: user.id, active: false }
            : url.endsWith('/users')
              ? [user]
              : []
        )
      )
    );
  vi.stubGlobal('fetch', fetch);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: /Utilisateurs/ }));
  fireEvent.click(await screen.findByRole('button', { name: 'Désactiver' }));
  expect(await screen.findByText('inactif')).toBeInTheDocument();
  expect(screen.getByText('Sara Test')).toBeInTheDocument();
  expect(
    fetch.mock.calls.some(
      ([url, options]) => url.endsWith('/users/u2/toggle-active') && options.method === 'PATCH'
    )
  ).toBe(true);
  expect(fetch.mock.calls.some(([, options]) => options.method === 'DELETE')).toBe(false);
});
