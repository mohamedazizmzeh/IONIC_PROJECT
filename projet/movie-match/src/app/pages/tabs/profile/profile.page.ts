import { Component, inject } from '@angular/core';
import { IonContent, IonAvatar, IonBadge, IonList, IonItem, IonLabel } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonContent, IonAvatar, IonBadge, IonList, IonItem, IonLabel],
  template: `
  <ion-content class="ion-padding"><div class="profile-wrap">
    @if (user()) {
      <div style="text-align: center; margin-bottom: 24px;">
        <ion-avatar style="width: 120px; height: 120px; margin: 0 auto 16px;">
          <img [src]="user()!.photo" alt="photo" />
        </ion-avatar>
        <h2 style="margin: 0;">{{ user()!.firstName }} {{ user()!.lastName }}</h2>
        <p style="color: var(--mm-muted); margin: 4px 0;">{{ user()!.age }} ans • {{ user()!.email }}</p>
        <ion-badge [color]="user()!.role === 'admin' ? 'danger' : 'primary'">
          {{ user()!.role }}
        </ion-badge>
      </div>

      <ion-list>
        <ion-item>
          <ion-label><strong>Films en favoris</strong></ion-label>
          <ion-badge slot="end" color="medium">{{ user()!.favorites.length }}</ion-badge>
        </ion-item>
      </ion-list>

      <!-- ✅ Bouton Admin (visible uniquement si role === admin) -->
      @if (user()!.role === 'admin') {
        <button class="btn-admin" (click)="goToAdmin()">
          ⚙️ Espace admin
        </button>
      }

      <!-- ✅ Bouton Logout -->
      <button class="btn-logout" (click)="onLogout()">
        🚪 Se déconnecter
      </button>
    } @else {
      <p style="text-align: center;">Chargement...</p>
    }
  </div></ion-content>
  `,
  styles: [`
    .profile-wrap { max-width: 560px; margin: 48px auto; padding: 32px 24px; background: #fffefa; border: 1px solid var(--mm-border); border-radius: 12px; }
    .btn-admin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 14px;
      background: #ebe8dc;
      color: #000;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 16px;
      transition: background 0.2s;
    }
    .btn-admin:hover { background: #e0ab08; }
    .btn-admin:active { background: #c69907; transform: scale(0.98); }

    .btn-logout {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 14px;
      background: var(--mm-accent);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 12px;
      transition: background 0.2s;
    }
    .btn-logout:hover { background: #cf3c4f; }
    .btn-logout:active { background: #b83145; transform: scale(0.98); }
  `]
})
export class ProfilePage {
  private auth = inject(AuthService);
  private navCtrl = inject(NavController);

  user = this.auth.currentUser;

  goToAdmin() {
    this.navCtrl.navigateForward('/admin');
  }

  async onLogout() {
    this.auth.logout();
    await this.navCtrl.navigateRoot('/login', { replaceUrl: true });
  }
}
