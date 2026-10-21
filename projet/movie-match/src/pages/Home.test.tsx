import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../AuthContext';
import Home from './Home';
import { clearMovieCache } from '../lib/movies';

it('keeps the latest search results when an earlier request finishes later', async () => {
  clearMovieCache();
  let oldSearch!: (response: Response) => void;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if (url.includes('query=old'))
        return new Promise((resolve) => {
          oldSearch = resolve;
        });
      const value = url.includes('/movies')
        ? []
        : { results: [{ id: 1, title: url.includes('query=new') ? 'New result' : 'Popular' }] };
      return Promise.resolve(new Response(JSON.stringify(value)));
    })
  );
  const { container } = render(
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
  expect(await screen.findByText('Popular')).toBeInTheDocument();
  const search = container.querySelector('ion-searchbar')!;
  await waitFor(() => expect(search).toHaveProperty('placeholder', 'Rechercher un film...'));
  fireEvent(search, new CustomEvent('ionInput', { detail: { value: 'old' } }));
  await waitFor(() => expect(oldSearch).toBeDefined());
  fireEvent(search, new CustomEvent('ionInput', { detail: { value: 'new' } }));
  expect(await screen.findByText('New result')).toBeInTheDocument();
  await act(async () =>
    oldSearch(new Response(JSON.stringify({ results: [{ id: 2, title: 'Old result' }] })))
  );
  expect(screen.queryByText('Old result')).not.toBeInTheDocument();
  expect(screen.getByText('New result')).toBeInTheDocument();
});
