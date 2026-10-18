import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { UserService } from './user.service';

describe('Favorite updates', () => {
  const user = { id: 'test', firstName: 'Test', lastName: 'User', email: 'test@example.com',
    age: 25, photo: '', role: 'user' as const, active: true, favorites: [10] };
  let auth: { currentUser: ReturnType<typeof signal<typeof user>> };
  let requests: Map<number, Subject<{ favorites: number[] }>>;
  let service: UserService;
  let post: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    auth = { currentUser: signal({ ...user, favorites: [10] }) };
    requests = new Map();
    post = vi.fn((path: string) => {
      const response = new Subject<{ favorites: number[] }>();
      requests.set(Number(path.split('/').pop()), response);
      return response;
    });
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: auth }, { provide: ApiService, useValue: { post } }
    ] });
    service = TestBed.inject(UserService);
  });

  afterEach(() => localStorage.clear());

  it('updates immediately and keeps both changes when responses arrive out of order', () => {
    service.addFavorite(1).subscribe();
    service.addFavorite(2).subscribe();
    expect(auth.currentUser().favorites).toEqual([10, 1, 2]);
    requests.get(2)!.next({ favorites: [10, 1, 2] });
    requests.get(2)!.complete();
    requests.get(1)!.next({ favorites: [10, 1] });
    requests.get(1)!.complete();
    expect(auth.currentUser().favorites).toEqual([10, 1, 2]);
  });

  it('reverts only a failed change while keeping other successful favorites', () => {
    service.addFavorite(1).subscribe({ error() {} });
    service.addFavorite(2).subscribe();
    requests.get(2)!.next({ favorites: [10, 2] });
    requests.get(2)!.complete();
    requests.get(1)!.error(new Error('Offline'));
    expect(auth.currentUser().favorites).toEqual([10, 2]);
  });

  it('ignores repeated taps on a movie whose update is already pending', () => {
    service.addFavorite(1).subscribe();
    service.addFavorite(1).subscribe();
    expect(post).toHaveBeenCalledTimes(1);
    requests.get(1)!.next({ favorites: [10, 1] });
    requests.get(1)!.complete();
  });
});
