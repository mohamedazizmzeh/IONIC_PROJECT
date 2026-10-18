import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../core/models/user.model';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders an asynchronous login error and releases the submit button', async () => {
    const response = new Subject<AuthResponse>();
    vi.spyOn(TestBed.inject(AuthService), 'login').mockReturnValue(response);
    component.email = 'preview@example.com';
    component.password = 'preview-password';
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button[type=submit]').disabled).toBe(true);

    response.error({ error: { message: 'Identifiants incorrects' } });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role=alert]')?.textContent).toContain('Identifiants incorrects');
    expect(fixture.nativeElement.querySelector('button[type=submit]').disabled).toBe(false);
  });
});
