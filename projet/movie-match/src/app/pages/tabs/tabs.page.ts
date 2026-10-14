import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="app-shell">
    <div class="app-content">
      <router-outlet></router-outlet>
    </div>

    <nav class="tab-bar">
      <a routerLink="/tabs/home" routerLinkActive="active" class="tab">
        <div class="tab-icon">🏠</div>
        <div class="tab-label">Accueil</div>
      </a>
      <a routerLink="/tabs/favorites" routerLinkActive="active" class="tab">
        <div class="tab-icon">❤️</div>
        <div class="tab-label">Favoris</div>
      </a>
      <a routerLink="/tabs/matches" routerLinkActive="active" class="tab">
        <div class="tab-icon">👥</div>
        <div class="tab-label">Matchs</div>
      </a>
      <a routerLink="/tabs/profile" routerLinkActive="active" class="tab">
        <div class="tab-icon">👤</div>
        <div class="tab-label">Profil</div>
      </a>
    </nav>
  </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
    }
    .app-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .tab-bar {
      display: flex;
      height: 60px;
      background: #ffffff;
      border-top: 1px solid #e0e0e0;
      box-shadow: 0 -1px 4px rgba(0,0,0,0.05);
    }
    .tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: #8c8c8c;
      font-size: 11px;
      transition: color 0.2s;
      cursor: pointer;
    }
    .tab.active {
      color: #3880ff;
      font-weight: 600;
    }
    .tab-icon {
      font-size: 22px;
      margin-bottom: 2px;
    }
    .tab-label {
      font-size: 11px;
    }
  `]
})
export class TabsPage {}
