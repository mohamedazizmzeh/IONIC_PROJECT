import { ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraDirection, EncodingType } from '@capacitor/camera';
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
export class RegisterPage implements OnDestroy {
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
  cameraOpen = false;
  openingCamera = false;
  @ViewChild('cameraPreview') private cameraPreview!: ElementRef<HTMLVideoElement>;
  private cameraStream?: MediaStream;
  private cameraRequest = 0;

  async openCamera() {
    if (this.openingCamera || this.cameraOpen) return;
    this.error = '';
    this.openingCamera = true;
    const request = ++this.cameraRequest;
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Camera.takePhoto({
          quality: 70, targetWidth: 300, targetHeight: 300,
          encodingType: EncodingType.JPEG, cameraDirection: CameraDirection.Front,
          saveToGallery: false, editable: 'no'
        });
        if (request !== this.cameraRequest) return;
        if (!result.thumbnail) throw new Error('Photo indisponible');
        this.photo = result.thumbnail.startsWith('data:')
          ? result.thumbnail : `data:image/jpeg;base64,${result.thumbnail}`;
      } else {
        if (!navigator.mediaDevices?.getUserMedia) {
          this.error = 'Caméra indisponible. Ouvre cette page en HTTPS ou sur localhost, avec un appareil équipé d’une caméra.';
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false
        });
        if (request !== this.cameraRequest) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        this.cameraStream = stream;
        this.cameraOpen = true;
        this.cameraPreview.nativeElement.srcObject = stream;
        await this.cameraPreview.nativeElement.play();
      }
    } catch (error) {
      if (request !== this.cameraRequest) return;
      this.closeCamera();
      const message = error instanceof Error ? error.message : String(error);
      if (!/cancel/i.test(message)) {
        this.error = 'Impossible d’ouvrir la caméra. Autorise son accès et vérifie qu’elle est disponible.';
      }
    } finally {
      if (request === this.cameraRequest) this.openingCamera = false;
      this.changeDetector.markForCheck();
    }
  }

  capturePhoto() {
    const video = this.cameraPreview.nativeElement;
    if (!this.cameraOpen || !video.videoWidth || !video.videoHeight) return;
    const scale = Math.min(1, 300 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) {
      this.error = 'Impossible de prendre la photo. Réessaie avec un autre navigateur.';
      this.closeCamera();
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    this.photo = canvas.toDataURL('image/jpeg', 0.7);
    this.closeCamera();
  }

  closeCamera() {
    ++this.cameraRequest;
    this.cameraStream?.getTracks().forEach(track => track.stop());
    this.cameraStream = undefined;
    if (this.cameraPreview) this.cameraPreview.nativeElement.srcObject = null;
    this.cameraOpen = false;
    this.openingCamera = false;
  }

  ngOnDestroy() {
    this.closeCamera();
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
