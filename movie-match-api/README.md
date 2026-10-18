# 🎬 Movie Match - Frontend

Application **Ionic + Angular** de gestion de films avec playlist de favoris et **matching entre utilisateurs** partageant les mêmes goûts.

---

## 📋 Description

Le frontend communique avec :
- **API backend** `movie-match-api` (comptes, favoris, matching) sur `http://localhost:3000`
- **API TMDB** (recherche et affiches de films)

### Fonctionnalités principales

- ✅ Inscription avec **photo de profil** (caméra ou galerie)
- ✅ Connexion / déconnexion avec **JWT**
- ✅ Consultation et **recherche de films** via TMDB
- ✅ Gestion d'une **playlist de favoris**
- ✅ **Matching** avec les utilisateurs ayant strictement > 75% de correspondance entre favoris
- ✅ **Profil** utilisateur avec photo, âge, rôle
- ✅ **Espace admin** : ajout de films + activation/désactivation de comptes
- ✅ **Toggle Populaires / Catalogue** dans la page d'accueil

---

## 🏗️ Structure du projet

```text
movie-match/
└── src/
    ├── environments/
    │   └── environment.ts              # Configuration (API URL, clé TMDB)
    └── app/
        ├── app.component.ts            # Bootstrap + refreshMe au démarrage
        ├── app.routes.ts               # Routes avec guards
        ├── core/
        │   ├── models/
        │   │   └── user.model.ts       # AppUser, AuthResponse
        │   ├── services/
        │   │   ├── api.service.ts      # Wrapper HTTP
        │   │   ├── auth.service.ts     # Login / logout / signal currentUser
        │   │   ├── user.service.ts     # Favoris + toggle user
        │   │   ├── tmdb.service.ts     # Recherche films + cache
        │   │   ├── movie.service.ts    # Catalogue admin
        │   │   └── match.service.ts    # Matching Jaccard
        │   ├── interceptors/
        │   │   └── jwt.interceptor.ts  # Ajoute le token auto
        │   └── guards/
        │       ├── auth.guard.ts       # Protège les routes privées
        │       └── admin.guard.ts      # Protège /admin
        └── pages/
            ├── login/                  # Connexion
            ├── register/               # Inscription + photo
            ├── tabs/                   # Barre de navigation custom
            │   ├── home/               # Films TMDB + Catalogue admin
            │   ├── favorites/          # Mes favoris
            │   ├── matches/            # Matching (> 75%)
            │   └── profile/            # Profil + logout
            └── admin/                  # Espace admin (2 onglets)
```

**Rôles des dossiers :**
- **`services/`** : centralisent les appels API et la logique métier
- **`guards/`** : contrôlent l'accès aux pages (auth, admin)
- **`interceptors/`** : ajoutent le JWT automatiquement aux requêtes HTTP
- **`models/`** : types TypeScript partagés (AppUser, AuthResponse)

---

## 🛠️ Stack technique

| Technologie | Rôle |
|---|---|
| **Angular 22** | Framework SPA (standalone components) |
| **Ionic 9** | Composants UI mobile |
| **TypeScript** | Langage |
| **Angular HttpClient** | Communication avec l'API |
| **Angular Signals** | Gestion d'état réactif |
| **TMDB API** | Recherche et affiches de films |
| **Capacitor** (optionnel) | Build Android / iOS |

---

## 🚀 Installation

### Prérequis

- **Node.js** ≥ 24.15.0 (compatible Angular 22)
- **npm**
- **Ionic CLI** (`npm install -g @ionic/cli`)
- Le backend **`movie-match-api`** qui tourne sur `http://localhost:3000`
- Une **clé API TMDB** (gratuite)

### Étapes

```bash
# 1. Accéder au dossier
cd projet/movie-match

# 2. Installer les dépendances
npm install

# 3. Configurer environment.ts (voir ci-dessous)

# 4. Démarrer le serveur de dev
npx ng serve --port 4200
```

Accès : `http://localhost:4200`

---

## ⚙️ Configuration

### `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  tmdb: {
    apiKey: 'TA_CLE_TMDB',
    baseUrl: 'https://api.themoviedb.org/3',
    imageUrl: 'https://image.tmdb.org/t/p/w200'   // w200 recommandé pour la performance
  }
};
```

**À personnaliser :**
- `apiKey` : ta clé TMDB (32 caractères, récupérable sur https://www.themoviedb.org/settings/api)
- `apiUrl` : l'URL du backend (si déployé, remplacer `localhost` par l'IP ou le domaine)

---

## 🗺️ Navigation

| URL | Page | Accès |
|---|---|---|
| `/login` | Connexion | Public |
| `/register` | Inscription | Public |
| `/tabs/home` | Films + Catalogue | Authentifié |
| `/tabs/favorites` | Mes favoris | Authentifié |
| `/tabs/matches` | Matching (> 75%) | Authentifié |
| `/tabs/profile` | Profil | Authentifié |
| `/admin` | Espace admin | Authentifié + Admin |

Les guards (`authGuard`, `adminGuard`) protègent les routes.

---

## 🎯 Fonctionnalités détaillées

### 📝 Inscription

- Champs : prénom, nom, âge, email, mot de passe
- **Photo** : via `<input type="file" capture="user">` (ouvre la caméra frontale sur mobile, le sélecteur sur desktop)
- **Compression côté client** : API **Canvas** → 300×300 px, qualité 70%
- **Taille finale** : ~25 KB
- Envoi en **Base64** au backend

### 🔐 Authentification

- **JWT** stocké dans `localStorage`
- **Intercepteur HTTP** : ajoute automatiquement `Authorization: Bearer <token>`
- **Signal `currentUser`** : gère l'état de connexion de manière réactive
- **`refreshMe()`** appelé au démarrage pour resynchroniser le profil

### 🎬 Accueil (Home)

**2 onglets internes :**

1. **🔥 Populaires** (TMDB)
   - Grille de films populaires
   - Barre de recherche
   - Bouton ❤️ pour gérer les favoris
   - **Cache** dans le service TMDB

2. **⭐ Catalogue** (Admin)
   - Films ajoutés par l'administrateur
   - Badge avec le nombre de films
   - Même interface (grille + favoris)

### ❤️ Favoris

- Liste des films favoris de l'utilisateur connecté
- Retrait d'un favori avec confirmation
- État vide avec message sympa

### 👥 Matching

- Appel : `GET /api/matches?threshold=75`
- Affichage : photo + nom + âge + films en commun + score
- **Barre de progression visuelle**
- Badge coloré selon le score (vert ≥ 90%, bleu sinon)
- Le calcul est effectué **côté backend**

### 👤 Profil

- Photo, nom, âge, email
- Badge de rôle (user / admin)
- Bouton **"⚙️ Espace admin"** (visible si admin)
- Bouton **"🚪 Se déconnecter"**

### ⚙️ Espace Admin

**2 onglets internes :**

1. **🎬 Films**
   - Recherche TMDB
   - Bouton "+ Ajouter" → écrit dans MongoDB
   - Badge "✓ Ajouté" pour les films déjà présents

2. **👥 Utilisateurs**
   - Liste avec photo + email + âge + nombre de favoris
   - Badge **"admin"** (rouge) ou **"inactif"** (gris)
   - Bouton **"Désactiver"** / **"Activer"** (toggle sans suppression)

---

## 🧪 Développement et tests

### Lancer l'ensemble du projet

**Terminal 1 — Backend**
```bash
cd movie-match-api
npm run dev
```
→ doit afficher : `✅ MongoDB connecté` + `🚀 API sur http://localhost:3000`

**Terminal 2 — Frontend**
```bash
cd projet/movie-match
npx ng serve --port 4200
```
→ ouvrir `http://localhost:4200`

### Scénario de test complet

```
1. S'inscrire avec photo
2. Ajouter 3 films aux favoris depuis Home
3. Vérifier la liste dans l'onglet Favoris
4. Se déconnecter
5. Créer un 2ᵉ compte avec les mêmes 3 films
6. Aller sur Matchs → score 100%
7. Se reconnecter en admin
8. Profil → Espace admin
9. Ajouter un film via recherche TMDB
10. Désactiver le 2ᵉ compte
11. Tester la connexion du compte désactivé → refusée
12. Réactiver le compte
```

---

## 📱 Build mobile (Capacitor)

### Android

```bash
npm install @capacitor/android
npx cap add android
npx cap sync android
npx cap open android
```

### iOS ⚠️

Nécessite **macOS + Xcode**. Impossible de builder depuis Windows/Linux.

---

## 🐛 Problèmes rencontrés et solutions

| Problème | Solution retenue |
|---|---|
| `<ion-tabs>` ne déclenche pas les clics | **Barre de navigation custom** avec `routerLink` |
| `<ion-button>` non réactif dans certains onglets | **Boutons HTML** stylés en CSS |
| Affichage non mis à jour après modification de tableau | **Signals Angular** (`signal()`, `.update()`) |
| `*ngIf` / `*ngFor` non reconnus (Angular 22) | Nouvelle syntaxe `@if` / `@for` |
| Chargement lent des affiches TMDB | `imageUrl: w200` + `loading="lazy"` + `decoding="async"` |
| Photo trop lourde au register | Compression Canvas (300×300, qualité 70%) |

---

## ✅ État du frontend

| Page | Statut |
|---|---|
| Login | ✅ |
| Register (avec photo) | ✅ |
| Tabs (barre custom) | ✅ |
| Home (Populaires + Catalogue) | ✅ |
| Favoris | ✅ |
| Matchs (> 75%) | ✅ |
| Profil + Logout | ✅ |
| Admin (2 onglets) | ✅ |
| Guards (auth + admin) | ✅ |

---

## 🚧 Ce qui reste à faire

### 🔴 Priorité haute
- [ ] Test complet du scénario de soutenance
- [ ] Vérifier la redirection des guards (déconnecté → /login)
- [ ] Préparer les comptes de test (admin + 2 users)

### 🟡 Priorité moyenne
- [ ] Nettoyer les `console.log()` de debug
- [ ] Ajouter un `.gitignore` propre
- [ ] Tester sur mobile (navigateur du téléphone)

### 🟢 Bonus (facultatif)
- [ ] Page détail d'un film (résumé + trailer YouTube)
- [ ] Déploiement du backend sur Render
- [ ] Build Android via Capacitor
- [ ] Notifications en temps réel quand un match apparaît

---

## 📌 Points techniques importants

- **Signals Angular** : utilisés partout pour la réactivité (`signal`, `update`, `set`)
- **Syntaxe `@if` / `@for`** : remplace `*ngIf` / `*ngFor` (Angular 17+)
- **Intercepteur JWT** : injecte automatiquement le token dans les requêtes
- **Guards** : `authGuard` et `adminGuard` protègent la navigation
- **Services** : séparent la logique métier du code des composants
- **Cache TMDB** : évite les appels répétés (dans `TmdbService`)
