import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonSpinner
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, IonContent, IonSpinner],
  templateUrl: './register.page.html'
})
export class RegisterPage {
  private changeDetector = inject(ChangeDetectorRef);
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
      this.changeDetector.markForCheck();

      URL.revokeObjectURL(objectUrl);
      console.log('Taille finale:', (this.photo.length / 1024).toFixed(1), 'KB');
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      this.error = 'Erreur de chargement image';
      this.changeDetector.markForCheck();
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
        this.changeDetector.markForCheck();
        this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message ?? 'Erreur lors de l\'inscription';
        this.changeDetector.markForCheck();
      }
    });
  }
}
