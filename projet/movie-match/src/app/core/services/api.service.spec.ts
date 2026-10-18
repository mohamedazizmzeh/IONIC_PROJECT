import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('Backend availability', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  it('explains that the server is unavailable without retrying a write', () => {
    let message = '';
    api.post('/auth/register', {}).subscribe({ error: error => message = error.error?.message });
    const request = http.expectOne(req => req.url.endsWith('/auth/register'));
    request.error(new ProgressEvent('error'));
    expect(message).toContain('serveur');
    http.expectNone(req => req.url.endsWith('/auth/register'));
  });

  it('releases a request that never responds after twelve seconds', () => {
    vi.useFakeTimers();
    let message = '';
    api.get('/movies').subscribe({ error: error => message = error.error?.message });
    const request = http.expectOne(req => req.url.endsWith('/movies'));
    vi.advanceTimersByTime(12001);
    expect(message).toContain('temps');
    expect(request.cancelled).toBe(true);
  });
});
