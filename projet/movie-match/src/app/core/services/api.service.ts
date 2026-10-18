import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TimeoutError, catchError, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  get<T>(path: string) { return this.request<T>('GET', path); }
  post<T>(path: string, body: unknown) { return this.request<T>('POST', path, body); }
  put<T>(path: string, body: unknown) { return this.request<T>('PUT', path, body); }
  patch<T>(path: string, body?: unknown) { return this.request<T>('PATCH', path, body ?? {}); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }

  private request<T>(method: string, path: string, body?: unknown) {
    return this.http.request<T>(method, `${this.base}${path}`, { body }).pipe(
      timeout(12000),
      catchError(error => {
        const timedOut = error instanceof TimeoutError;
        if (timedOut || (error instanceof HttpErrorResponse && error.status === 0)) {
          return throwError(() => new HttpErrorResponse({
            status: 0,
            url: `${this.base}${path}`,
            error: { message: timedOut
              ? 'Le serveur met trop de temps à répondre. Réessaie dans quelques instants.'
              : 'Le serveur est indisponible. Vérifie ta connexion et réessaie.' }
          }));
        }
        return throwError(() => error);
      })
    );
  }
}
