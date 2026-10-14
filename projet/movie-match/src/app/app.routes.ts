import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },

  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },

  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./pages/tabs/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'favorites',
        loadComponent: () => import('./pages/tabs/favorites/favorites.page').then(m => m.FavoritesPage)
      },
      {
        path: 'matches',
        loadComponent: () => import('./pages/tabs/matches/matches.page').then(m => m.MatchesPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/tabs/profile/profile.page').then(m => m.ProfilePage)
      },
    ]
  },

  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage)
  },

  { path: '**', redirectTo: 'login' }
];
