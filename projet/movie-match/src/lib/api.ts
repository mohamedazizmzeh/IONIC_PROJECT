import { environment } from '../environments/environment';

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0
  ) {
    super(message);
  }
}

export async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = response.status === 204 ? undefined : await response.json().catch(() => ({}));
    if (!response.ok)
      throw new ApiError(data?.message || 'La requête a échoué. Réessaie.', response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted && !timedOut)
      throw new DOMException('Requête annulée', 'AbortError');
    throw new ApiError(
      timedOut
        ? 'Le serveur met trop de temps à répondre. Réessaie dans quelques instants.'
        : 'Le serveur est indisponible. Vérifie ta connexion et réessaie.'
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}

export function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body) headers['Content-Type'] = 'application/json';
  new Headers(options.headers).forEach((value, key) => {
    headers[key] = value;
  });
  const token = localStorage.getItem('token');
  if (token && !['/auth/login', '/auth/register'].includes(path.split('?')[0])) {
    headers.Authorization = `Bearer ${token}`;
  }
  const base = (import.meta.env.VITE_API_URL || environment.apiUrl).replace(/\/$/, '');
  return requestJson<T>(`${base}${path}`, { ...options, headers }, 12000);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Une erreur est survenue. Réessaie.';
}
