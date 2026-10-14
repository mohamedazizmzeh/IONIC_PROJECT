import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`,
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.auth.refreshMe().subscribe({
        error: (err) => {
          console.warn('Refresh user échoué:', err);
          if (err.status === 401) {
            this.auth.logout();
          }
        }
      });
    }
  }
}
