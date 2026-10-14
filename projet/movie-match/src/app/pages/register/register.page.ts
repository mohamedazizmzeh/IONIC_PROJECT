import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonInput, IonButton, IonItem, IonText, IonSpinner
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonButton, IonItem, IonText, IonSpinner],
  template: `
  <ion-content class="ion-padding">
    <div class="wrap">
      <h2>Créer un compte</h2>

      <label for="photoInput" class="photo-box">
        @if (photo) {
          <img [src]="photo" />
        } @else {
          <div class="placeholder">
            <div style="font-size: 40px;">📷</div>
            <p>Prendre une photo</p>
          </div>
        }
      </label>
      <input
        id="photoInput"
        type="file"
        accept="image/*"
        capture="user"
        (change)="onFileSelected($event)"
        style="display: none;"
      />

      <ion-item>
        <ion-input [(ngModel)]="firstName" label="Prénom" labelPlacement="floating"></ion-input>
      </ion-item>
      <ion-item>
        <ion-input [(ngModel)]="lastName" label="Nom" labelPlacement="floating"></ion-input>
      </ion-item>
      <ion-item>
        <ion-input [(ngModel)]="age" type="number" label="Âge" labelPlacement="floating"></ion-input>
      </ion-item>
      <ion-item>
        <ion-input [(ngModel)]="email" type="email" label="Email" labelPlacement="floating"></ion-input>
      </ion-item>
      <ion-item>
        <ion-input [(ngModel)]="password" type="password" label="Mot de passe" labelPlacement="floating"></ion-input>
      </ion-item>

      <ion-button expand="block" (click)="onRegister()" [disabled]="loading" class="ion-margin-top">
        @if (loading) {
          <ion-spinner name="crescent"></ion-spinner>
        } @else {
          <span>S'inscrire</span>
        }
      </ion-button>

      @if (error) {
        <ion-text color="danger"><p style="text-align:center">{{ error }}</p></ion-text>
      }

      <ion-button fill="clear" routerLink="/login" expand="block">Déjà un compte ?</ion-button>
    </div>
  </ion-content>
  `,
  styles: [`
    .wrap { max-width: 420px; margin: 4vh auto; }
    h2 { text-align: center; }
    .photo-box {
      width: 140px; height: 140px; margin: 0 auto 20px;
      border: 2px dashed #999; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; cursor: pointer;
    }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
    .placeholder { text-align: center; color: #666; }
    .placeholder p { margin: 4px 0 0; font-size: 12px; }
    ion-item { margin-bottom: 12px; }
  `]
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  firstName = '';
  lastName = '';
  age?: number;
  email = '';
  password = '';
  photo?: string;
  loading = false;
  error = '';

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // ⚡ URL.createObjectURL est instantané
    const objectUrl = URL.createObjectURL(file);

    const img = new Image();
    img.onload = () => {
      const maxSize = 300;
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, width, height);
      this.photo = canvas.toDataURL('image/jpeg', 0.7);

      URL.revokeObjectURL(objectUrl);
      console.log('Taille finale:', (this.photo.length / 1024).toFixed(1), 'KB');
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      this.error = 'Erreur de chargement image';
    };
    img.src = objectUrl;
  }

  onRegister() {
    if (!this.firstName || !this.lastName || !this.age || !this.email || !this.password || !this.photo) {
      this.error = 'Remplis tous les champs et prends une photo';
      return;
    }
    if (this.photo.length > 900_000) {
      this.error = 'Photo trop lourde, réessaie';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.register({
      firstName: this.firstName,
      lastName: this.lastName,
      age: this.age,
      email: this.email,
      password: this.password,
      photo: this.photo,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message ?? 'Erreur lors de l\'inscription';
      }
    });
  }
}
