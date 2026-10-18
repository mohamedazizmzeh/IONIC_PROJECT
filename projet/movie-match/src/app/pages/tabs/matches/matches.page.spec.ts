import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchesPage } from './matches.page';
import { of, throwError } from 'rxjs';
import { MatchService } from '../../../core/services/match.service';

describe('MatchesPage', () => {
  let component: MatchesPage;
  let fixture: ComponentFixture<MatchesPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MatchService, useValue: { findMatches: () => of([]) } }]
    });
    fixture = TestBed.createComponent(MatchesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows a server failure instead of claiming there are no matches', () => {
    vi.spyOn(TestBed.inject(MatchService), 'findMatches').mockReturnValue(throwError(() => new Error('Offline')));
    component.loadMatches();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Aucun match trouvé');
  });

  it('explains that the threshold must be exceeded', () => {
    expect(fixture.nativeElement.textContent).toContain('Seuil > 75%');
    expect(fixture.nativeElement.textContent).toContain('doit dépasser');
  });

  it('displays accepted scores without rounding them to a whole percent', () => {
    component.matches.set([{
      user: { id: 'test', firstName: 'Test', lastName: 'User', photo: '', age: 25 },
      score: 76 / 101 * 100,
      common: 76
    }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.match-score').textContent).toContain('75.25%');
  });
});
