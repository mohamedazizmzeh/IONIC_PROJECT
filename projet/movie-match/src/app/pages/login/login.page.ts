import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonSpinner
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, IonContent, IonSpinner],
  templateUrl: './login.page.html'
})
export class LoginPage {
  private changeDetector = inject(ChangeDetectorRef);
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  error = '';

  onLogin() {
    if (!this.email || !this.password) {
      this.error = 'Remplis tous les champs';
      return;
    }
    this.loading = true;
    this.error = '';

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.changeDetector.markForCheck();
        this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message ?? 'Erreur de connexion';
        this.changeDetector.markForCheck();
      }
    });
  }
}
