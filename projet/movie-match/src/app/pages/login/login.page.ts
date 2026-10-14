import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonInput, IonButton, IonItem, IonText, IonSpinner
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonButton, IonItem, IonText, IonSpinner],
  template: `
  <ion-content class="ion-padding">
    <div class="wrap">
      <h1>🎬 Movie Match</h1>
      <p>Connecte-toi pour retrouver tes films</p>

      <ion-item>
        <ion-input [(ngModel)]="email" type="email" label="Email" labelPlacement="floating"></ion-input>
      </ion-item>
      <ion-item>
        <ion-input [(ngModel)]="password" type="password" label="Mot de passe" labelPlacement="floating"></ion-input>
      </ion-item>

      <ion-button expand="block" (click)="onLogin()" [disabled]="loading" class="ion-margin-top">
        @if (loading) {
          <ion-spinner name="crescent"></ion-spinner>
        } @else {
          <span>Se connecter</span>
        }
      </ion-button>

      @if (error) {
        <ion-text color="danger"><p style="text-align:center">{{ error }}</p></ion-text>
      }

      <ion-button fill="clear" routerLink="/register" expand="block">
        Créer un compte
      </ion-button>
    </div>
  </ion-content>
  `,
  styles: [`
    .wrap { max-width: 420px; margin: 10vh auto; text-align: center; }
    h1 { font-size: 2.4rem; margin-bottom: .2rem; }
    ion-item { margin-bottom: 12px; }
  `]
})
export class LoginPage {
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
        this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message ?? 'Erreur de connexion';
      }
    });
  }
}
