import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner,
  IonText, IonAvatar, IonBadge
} from '@ionic/angular';
import { MatchService, MatchResult } from '../../../core/services/match.service';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner,
    IonText, IonAvatar, IonBadge
  ],
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title>👥 Mes matchs</ion-title>
      <div slot="end" style="margin-right: 12px; font-size: 12px; color: var(--mm-muted);">
        Seuil &gt; {{ threshold }}%
      </div>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    @if (error()) {
      <div class="request-error" role="alert"><p>{{ error() }}</p><button type="button" (click)="loadMatches()">Réessayer</button></div>
    }
    @if (loading()) {
      <div style="text-align: center; padding: 40px;">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Recherche de matchs...</p>
      </div>
    } @else if (!error() && matches().length === 0) {
      <ion-text color="medium">
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 60px;">🎯</div>
          <p style="font-size: 16px; margin-top: 16px;">
            Aucun match trouvé pour l'instant.
          </p>
          <p style="font-size: 14px;">
            Le taux de correspondance doit dépasser <strong>{{ threshold }}%</strong> avec un autre utilisateur.
          </p>
          <p style="font-size: 14px;">
            Ajoute plus de films à tes favoris pour augmenter tes chances !
          </p>
        </div>
      </ion-text>
    } @else {
      <div style="padding: 12px;">
        <p style="text-align: center; color: var(--mm-muted); font-size: 13px;">
          {{ matches().length }} utilisateur(s) partagent tes goûts 🎬
        </p>

        @for (match of matches(); track match.user.id) {
          <div class="match-card">
            <ion-avatar style="width: 60px; height: 60px;">
              <img [src]="match.user.photo" [alt]="match.user.firstName" />
            </ion-avatar>

            <div class="match-info">
              <div class="match-name">
                {{ match.user.firstName }} {{ match.user.lastName }}
              </div>
              <div class="match-detail">
                {{ match.common }} film(s) en commun • {{ match.user.age }} ans
              </div>
              <div class="match-progress">
                <div class="match-progress-bar" [style.width.%]="match.score"></div>
              </div>
            </div>

            <ion-badge
              [color]="match.score >= 90 ? 'success' : 'primary'"
              class="match-score">
              {{ match.score.toFixed(2) }}%
            </ion-badge>
          </div>
        }
      </div>
    }
  </ion-content>
  `,
  styles: [`
    .match-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #fffefa;
      border-radius: 12px;
      border: 1px solid var(--mm-border);
      margin-bottom: 12px;
    }
    .match-info { flex: 1; }
    .match-name {
      font-weight: 600;
      font-size: 15px;
      margin-bottom: 4px;
    }
    .match-detail {
      font-size: 12px;
      color: var(--mm-muted);
      margin-bottom: 6px;
    }
    .match-progress {
      width: 100%;
      height: 6px;
      background: #eee;
      border-radius: 3px;
      overflow: hidden;
    }
    .match-progress-bar {
      height: 100%;
      background: var(--mm-accent);
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    .match-score {
      font-size: 14px;
      padding: 6px 10px;
    }
  `]
})
export class MatchesPage implements OnInit, OnDestroy {
  private matchService = inject(MatchService);

  // ✅ Signals
  matches = signal<MatchResult[]>([]);
  loading = signal(true);
  threshold = 75;
  error = signal('');
  private request?: Subscription;

  ngOnInit() {
    this.loadMatches();
  }

  loadMatches() {
    this.request?.unsubscribe();
    this.error.set('');
    this.loading.set(true);
    this.request = this.matchService.findMatches(this.threshold).subscribe({
      next: (results) => {
        this.matches.set(results);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Les matchs sont temporairement indisponibles. Réessaie dans quelques instants.');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy() { this.request?.unsubscribe(); }
}
