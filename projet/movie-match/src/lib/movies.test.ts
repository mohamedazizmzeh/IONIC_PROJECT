import { getMovie, getPopular, searchMovies, clearMovieCache, loadFavoriteMovies } from './movies';
import { waitFor } from '@testing-library/react';

describe('movie loading', () => {
  beforeEach(() => clearMovieCache());

  it('shares one request for a movie and caches the next visit', async () => {
    const fetch = vi
      .fn()
      .mockImplementation(async () => new Response(JSON.stringify({ id: 1, title: 'Film' })));
    vi.stubGlobal('fetch', fetch);
    const [first, second] = await Promise.all([getMovie(1), getMovie(1)]);
    expect(first).toEqual(second);
    await getMovie(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('never sends the app session to TMDB', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [] })));
    vi.stubGlobal('fetch', fetch);
    localStorage.setItem('token', 'test-token');
    await getPopular();
    expect(fetch.mock.calls[0][1].headers).toBeUndefined();
  });

  it('recovers after a failed request', async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Offline'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, title: 'Film' })));
    vi.stubGlobal('fetch', fetch);
    await expect(getMovie(1)).rejects.toThrow();
    await expect(getMovie(1)).resolves.toEqual({ id: 1, title: 'Film' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('uses the same TMDB search query and returns results', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ results: [{ id: 1, title: 'Film' }] })));
    vi.stubGlobal('fetch', fetch);
    expect((await searchMovies(' film '))[0].id).toBe(1);
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get('query')).toBe('film');
  });

  it('keeps favorites in order and reports partial failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/movie/2?')) throw new TypeError('Offline');
        return new Response(
          JSON.stringify({ id: Number(new URL(url).pathname.split('/').pop()), title: 'Film' })
        );
      })
    );
    const result = await loadFavoriteMovies([3, 2, 1, 3]);
    expect(result.movies.map((movie) => movie.id)).toEqual([3, 1]);
    expect(result.failed).toBe(true);
  });

  it('keeps favorite detail requests limited to four at once', async () => {
    let active = 0;
    let maximum = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        maximum = Math.max(maximum, ++active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        --active;
        return new Response(
          JSON.stringify({ id: Number(new URL(url).pathname.split('/').pop()), title: 'Film' })
        );
      })
    );
    const result = await loadFavoriteMovies([1, 2, 3, 4, 5, 6]);
    expect(maximum).toBe(4);
    expect(result.movies).toHaveLength(6);
  });

  it('loads the next favorite as soon as a slot is free', async () => {
    const releases: (() => void)[] = [];
    let finishAll = false;
    const fetch = vi.fn().mockImplementation((url: string) => {
      const movie = { id: Number(new URL(url).pathname.split('/').pop()), title: 'Film' };
      if (finishAll) return Promise.resolve(new Response(JSON.stringify(movie)));
      return new Promise<Response>((resolve) =>
        releases.push(() => resolve(new Response(JSON.stringify(movie))))
      );
    });
    vi.stubGlobal('fetch', fetch);
    const request = loadFavoriteMovies([1, 2, 3, 4, 5, 6]);
    expect(fetch).toHaveBeenCalledTimes(4);
    releases[0]();
    try {
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(5), { timeout: 150 });
    } finally {
      finishAll = true;
      releases.forEach((release) => release());
      await request;
    }
  });
});
