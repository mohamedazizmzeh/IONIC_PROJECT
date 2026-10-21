import { api, ApiError, requestJson } from './api';
import { environment } from '../environments/environment';

describe('backend compatibility', () => {
  it('keeps the same endpoint and authenticates protected requests', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('[]'));
    vi.stubGlobal('fetch', fetch);
    localStorage.setItem('token', 'test-token');
    await api('/users');
    expect(fetch).toHaveBeenCalledWith(
      `${environment.apiUrl}/users`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' })
      })
    );
  });

  it('does not send an existing session when logging in', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetch);
    localStorage.setItem('token', 'old-token');
    await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'test' })
    });
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('preserves API validation errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ message: 'Identifiants invalides' }), { status: 400 })
        )
    );
    await expect(api('/auth/login', { method: 'POST' })).rejects.toThrow('Identifiants invalides');
  });

  it('explains an unavailable server without retrying writes', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetch);
    await expect(api('/auth/register', { method: 'POST' })).rejects.toThrow('serveur');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('exposes the HTTP status for session handling', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    const error = await api('/auth/me').catch((error) => error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error instanceof ApiError && error.status).toBe(401);
  });

  it('ends a stalled request with a useful timeout error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError'))
            );
          })
      )
    );
    await expect(requestJson('https://example.com', {}, 5)).rejects.toThrow('trop de temps');
  });

  it('preserves cancellation when leaving a screen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError'))
            );
          })
      )
    );
    const controller = new AbortController();
    const request = api('/users', { signal: controller.signal });
    controller.abort();
    await expect(request).rejects.toHaveProperty('name', 'AbortError');
  });
});
