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

  function showDeck() {
    popular.next([{ id: 1, title: 'First movie' }, { id: 2, title: 'Second movie' }]);
  }

  it('passes a film without changing favorites and can rewind the pass', () => {
    showDeck();
    component.decide('pass');
    expect(component.currentMovie()?.id).toBe(2);
    expect(addFavorite).not.toHaveBeenCalled();
    component.rewind();
    expect(component.currentMovie()?.id).toBe(1);
    expect(removeFavorite).not.toHaveBeenCalled();
  });

  it('likes a film and rewinds both the card and its new favorite', () => {
    showDeck();
    component.decide('like');
    expect(addFavorite).toHaveBeenCalledWith(1);
    expect(component.currentMovie()?.id).toBe(2);
    expect(component.canRewind()).toBe(false);
    favoriteResponse.next({ favorites: [1] });
    favoriteResponse.complete();
    component.rewind();
    expect(removeFavorite).toHaveBeenCalledWith(1);
    expect(component.currentMovie()?.id).toBe(1);
  });

  it('preserves a favorite that existed before the swipe', () => {
    currentUser.update(user => user && ({ ...user, favorites: [1] }));
    showDeck();
    component.decide('like');
    component.rewind();
    expect(addFavorite).not.toHaveBeenCalled();
    expect(removeFavorite).not.toHaveBeenCalled();
    expect(component.currentMovie()?.id).toBe(1);
  });

  it('restores a film if saving its like fails', () => {
    showDeck();
    component.decide('like');
    favoriteResponse.error(new Error('Offline'));
    expect(component.currentMovie()?.id).toBe(1);
    expect(component.canRewind()).toBe(false);
    expect(component.error()).not.toBe('');
  });

  it('keeps a saved like and its history if removing it during rewind fails', () => {
    showDeck();
    component.decide('like');
    favoriteResponse.next({ favorites: [1] });
    favoriteResponse.complete();
    const undoResponse = new Subject<{ favorites: number[] }>();
    removeFavorite.mockReturnValue(undoResponse);
    component.rewind();
    undoResponse.error(new Error('Offline'));
    expect(component.currentMovie()?.id).toBe(2);
    expect(component.canRewind()).toBe(true);
    expect(component.error()).not.toBe('');
  });

  it('blocks repeated choices until the previous save completes', () => {
    showDeck();
    component.decide('like');
    component.decide('like');
    component.decide('pass');
    component.rewind();
    expect(addFavorite).toHaveBeenCalledTimes(1);
    expect(component.currentMovie()?.id).toBe(2);
  });

  it('does not restore an old card into a different search after a failed save', () => {
    showDeck();
    component.decide('like');
    component.onSearch({ detail: { value: 'new' } });
    searches.get('new')!.next([{ id: 3, title: 'New movie' }]);
    favoriteResponse.error(new Error('Offline'));
    expect(component.currentMovie()?.id).toBe(3);
    expect(component.canRewind()).toBe(false);
  });

  it('can rewind after the final card and clears history for a new search', () => {
    showDeck();
    component.decide('pass');
    component.decide('pass');
    expect(component.currentMovie()).toBeUndefined();
    component.rewind();
    expect(component.currentMovie()?.id).toBe(2);
    component.onSearch({ detail: { value: 'new' } });
    searches.get('new')!.next([{ id: 3, title: 'New movie' }]);
    expect(component.currentMovie()?.id).toBe(3);
    expect(component.canRewind()).toBe(false);
  });
});
