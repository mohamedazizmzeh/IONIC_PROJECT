import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FavoritesPage } from './favorites.page';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TmdbService } from '../../../core/services/tmdb.service';

describe('FavoritesPage', () => {
  let component: FavoritesPage;
  let fixture: ComponentFixture<FavoritesPage>;
  let first: Subject<any>;
  let second: Subject<any>;

  beforeEach(() => {
    first = new Subject();
    second = new Subject();
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { currentUser: signal({ favorites: [1, 2] }) } },
      { provide: TmdbService, useValue: {
        getById: (id: number) => id === 1 ? first : second, poster: () => ''
      } }
    ] });
    fixture = TestBed.createComponent(FavoritesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps loading until favorite movies actually arrive', () => {
    expect(component.loading()).toBe(true);
    second.next({ id: 2, title: 'Second' });
    second.complete();
    expect(component.loading()).toBe(true);
    first.next({ id: 1, title: 'First' });
    first.complete();
    expect(component.loading()).toBe(false);
    expect(component.movies().map(movie => movie.id)).toEqual([1, 2]);
  });

  it('does not duplicate cards when favorite movies are loaded again', () => {
    component.load();
    first.next({ id: 1, title: 'First' });
    first.complete();
    second.next({ id: 2, title: 'Second' });
    second.complete();
    expect(component.movies().map(movie => movie.id)).toEqual([1, 2]);
  });
});
