import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home.page';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { AppUser } from '../../../core/models/user.model';
import { TmdbService } from '../../../core/services/tmdb.service';
import { MovieService } from '../../../core/services/movie.service';
import { AuthService } from '../../../core/services/auth.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let popular: Subject<any[]>;
  let searches: Map<string, Subject<any[]>>;
  let currentUser: ReturnType<typeof signal<AppUser | null>>;
  let favoriteResponse: Subject<{ favorites: number[] }>;
  let addFavorite: ReturnType<typeof vi.fn>;
  let removeFavorite: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    popular = new Subject();
    searches = new Map();
    currentUser = signal<AppUser | null>({ id: 'test', firstName: 'Test', lastName: 'User',
      email: 'test@example.com', age: 25, photo: '', role: 'user', active: true, favorites: [] });
    favoriteResponse = new Subject();
    addFavorite = vi.fn(() => favoriteResponse);
    removeFavorite = vi.fn(() => of({ favorites: [] }));
    TestBed.configureTestingModule({ providers: [
      { provide: TmdbService, useValue: {
        getPopular: () => popular,
        search: (query: string) => {
          const result = new Subject<any[]>();
          searches.set(query, result);
          return result;
        },
        poster: () => ''
      } },
      { provide: MovieService, useValue: { list: () => of([]) } },
      { provide: AuthService, useValue: { currentUser } },
      { provide: UserService, useValue: { pendingFavorites: signal(new Set<number>()), addFavorite, removeFavorite } }
    ] });
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the latest search results when responses arrive out of order', () => {
    component.onSearch({ detail: { value: 'old' } });
    component.onSearch({ detail: { value: 'new' } });
    searches.get('new')!.next([{ id: 2, title: 'Latest result' }]);
    searches.get('old')!.next([{ id: 1, title: 'Outdated result' }]);
    popular.next([{ id: 3, title: 'Old popular response' }]);
    expect(component.movies().map(movie => movie.id)).toEqual([2]);
  });

  it('does not overwrite the catalogue with a late popular response', () => {
    component.switchTab('catalog');
    popular.next([{ id: 1, title: 'Late response' }]);
    expect(component.movies()).toEqual([]);
  });

  it('does not pretend that a failed movie request returned no movies', () => {
    popular.error(new Error('Network unavailable'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
  });

  it('shows a movie grid with individual heart buttons', () => {
    popular.next([{ id: 1, title: 'First movie' }, { id: 2, title: 'Second movie' }]);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.fav-btn');
    expect(fixture.nativeElement.querySelector('.movies-grid')).not.toBeNull();
    expect(buttons.length).toBe(2);
    expect(fixture.nativeElement.querySelector('app-movie-swipe')).toBeNull();
    buttons[0].click();
    expect(addFavorite).toHaveBeenCalledWith(1);
  });

  it('removes a favorite using its heart button', () => {
    currentUser.update(user => user && ({ ...user, favorites: [1] }));
    popular.next([{ id: 1, title: 'First movie' }]);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.fav-btn') as HTMLButtonElement;
    expect(button?.getAttribute('aria-pressed')).toBe('true');
    button.click();
    expect(removeFavorite).toHaveBeenCalledWith(1);
  });

  it('shows a visible error if saving a favorite fails', () => {
    popular.next([{ id: 1, title: 'First movie' }]);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.fav-btn') as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    favoriteResponse.error(new Error('Offline'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
  });
});
