import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TmdbService } from './tmdb.service';
import { jwtInterceptor } from '../interceptors/jwt.interceptor';
import { environment } from '../../../environments/environment';

describe('Movie requests', () => {
  let service: TmdbService;
  let http: HttpTestingController;
  let originalKey: string;

  beforeEach(() => {
    originalKey = environment.tmdb.apiKey;
    environment.tmdb.apiKey = 'test-key';
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([jwtInterceptor])), provideHttpClientTesting()
    ] });
    service = TestBed.inject(TmdbService);
    http = TestBed.inject(HttpTestingController);
    localStorage.setItem('token', 'test-session');
  });

  afterEach(() => {
    environment.tmdb.apiKey = originalKey;
    localStorage.clear();
    http.verify();
  });

  it('does not send the application session to TMDB', () => {
    service.getPopular().subscribe();
    const request = http.expectOne(req => req.url.endsWith('/movie/popular'));
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ results: [] });
  });

  it('still authenticates requests to the application API', () => {
    TestBed.inject(HttpClient).get(`${environment.apiUrl}/users`).subscribe();
    const request = http.expectOne(req => req.url.endsWith('/users'));
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-session');
    request.flush([]);
  });

  it('allows a movie request to recover after a transient failure', () => {
    service.getById(1).subscribe({ error() {} });
    http.expectOne(req => req.url.endsWith('/movie/1')).flush({}, { status: 503, statusText: 'Unavailable' });
    let movieId = 0;
    service.getById(1).subscribe(movie => movieId = movie.id);
    http.expectOne(req => req.url.endsWith('/movie/1')).flush({ id: 1 });
    expect(movieId).toBe(1);
  });

  it('shares in-flight movie details and caches subsequent visits', () => {
    const results: number[] = [];
    service.getById(1).subscribe(movie => results.push(movie.id));
    service.getById(1).subscribe(movie => results.push(movie.id));
    const requests = http.match(req => req.url.endsWith('/movie/1'));
    requests.forEach(request => request.flush({ id: 1 }));
    expect(requests.length).toBe(1);
    service.getById(1).subscribe(movie => results.push(movie.id));
    const repeated = http.match(req => req.url.endsWith('/movie/1'));
    repeated.forEach(request => request.flush({ id: 1 }));
    expect(repeated.length).toBe(0);
    expect(results).toEqual([1, 1, 1]);
  });
});
