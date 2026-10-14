# 🎬 Movie Match API

API REST développée avec **Node.js** et **Express** pour l'application **Movie Match**. Elle gère les comptes utilisateurs, le catalogue de films et l'algorithme de matching entre utilisateurs.

---

## 📋 Description

L'API utilise **MongoDB Atlas** pour stocker les utilisateurs et le catalogue de films. L'authentification est basée sur **JWT**, avec deux rôles : `user` et `admin`.

### Fonctionnalités principales

- ✅ Inscription et connexion des utilisateurs
- ✅ Authentification JWT avec gestion des rôles (`user` / `admin`)
- ✅ Consultation et modification du profil utilisateur
- ✅ Ajout / suppression de films dans les favoris
- ✅ Gestion du catalogue de films par les administrateurs
- ✅ Activation / désactivation des comptes (sans suppression)
- ✅ **Matching entre utilisateurs** via l'**indice de Jaccard** (seuil ≥ 75%)

---

## 🏗️ Structure du projet

```text
movie-match-api/
├── config/
│   └── db.js                    # Connexion MongoDB (Mongoose)
├── controllers/
│   ├── auth.controller.js       # register, login, me
│   ├── user.controller.js       # users, favoris, toggle-active
│   ├── movie.controller.js      # CRUD films
│   └── match.controller.js      # Algorithme Jaccard
├── middleware/
│   ├── auth.js                  # Vérification JWT
│   └── admin.js                 # Vérification rôle admin
├── models/
│   ├── User.js                  # Schéma User (Mongoose)
│   └── Movie.js                 # Schéma Movie (Mongoose)
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── movie.routes.js
│   └── match.routes.js
├── .env                         # Variables d'environnement (NON versionné)
├── .gitignore
├── server.js                    # Point d'entrée Express
└── package.json
```

**Rôle des dossiers :**
- **`routes/`** : définissent les endpoints et associent chaque URL à un controller
- **`controllers/`** : contiennent la logique métier (traitement des requêtes)
- **`models/`** : schémas Mongoose décrivant les documents MongoDB
- **`middleware/`** : fonctions intermédiaires (auth JWT, vérification admin)
- **`config/`** : configuration de la connexion à la base de données

---

## 🛠️ Stack technique

| Technologie | Rôle |
|---|---|
| **Node.js** ≥ 18 | Environnement d'exécution |
| **Express** | Framework web / API REST |
| **MongoDB Atlas** | Base de données NoSQL cloud |
| **Mongoose** | ODM pour MongoDB |
| **jsonwebtoken** | Génération / vérification des JWT |
| **bcryptjs** | Hachage des mots de passe |
| **cors** | Gestion des requêtes cross-origin |
| **dotenv** | Chargement du fichier `.env` |
| **nodemon** | Rechargement automatique (dev) |

---

## 🚀 Installation

### Prérequis

- **Node.js** ≥ 18
- **Compte MongoDB Atlas** (gratuit M0)
- Une **clé API TMDB** (facultative côté backend, utilisée côté frontend)

### Étapes

```bash
# 1. Accéder au dossier
cd movie-match-api

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env (voir section suivante)

# 4. Lancer en développement
npm run dev
```

### Fichier `.env` (à la racine)

```env
PORT=3000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/moviematch?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_long_random_secret_change_me
JWT_EXPIRES=7d
```

⚠️ **Important** : la chaîne `.mongodb.net/` doit être immédiatement suivie du nom de la base (`moviematch`), PUIS du `?`. Sans cela, MongoDB se connecte à la base `test` par défaut — et toutes les données existantes deviennent invisibles.

⚠️ Le fichier `.env` ne doit **jamais** être versionné sur Git. Utiliser un `.env.example` pour documenter les variables nécessaires.

### Fichier `.gitignore` (à la racine)

```gitignore
node_modules/
.env
*.log
.DS_Store
```

---

## 📡 Endpoints API

Les routes ci-dessous sont relatives à leur préfixe. Ex : `/register` → `/api/auth/register`.

### 🔐 Authentification — `/api/auth`

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/register` | Public | Créer un compte |
| POST | `/login` | Public | Se connecter → `{ token, user }` |
| GET | `/me` | Utilisateur connecté | Récupérer son profil |

### 👥 Utilisateurs — `/api/users`

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/` | Admin | Liste de tous les utilisateurs |
| PATCH | `/:id/toggle-active` | Admin | Activer / désactiver un compte |
| POST | `/favorites/:movieId` | Utilisateur connecté | Ajouter un film aux favoris |
| DELETE | `/favorites/:movieId` | Utilisateur connecté | Retirer un film des favoris |
| PUT | `/photo` | Utilisateur connecté | Modifier la photo de profil |

### 🎬 Films — `/api/movies`

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/` | Utilisateur connecté | Consulter le catalogue |
| POST | `/` | Admin | Ajouter un film |
| DELETE | `/:id` | Admin | Supprimer un film |

### 🎯 Matching — `/api/matches`

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/?threshold=75` | Utilisateur connecté | Trouver les utilisateurs avec un score ≥ seuil |

Le paramètre `threshold` définit le score minimum (défaut : **75**).

---

## 🧮 Algorithme de matching (Jaccard)

Le matching compare les favoris de deux utilisateurs avec l'**indice de Jaccard** :

```text
J(A, B) = |A ∩ B| / |A ∪ B| × 100
```

- `A` : films favoris de l'utilisateur A
- `B` : films favoris de l'utilisateur B
- `A ∩ B` : films en commun
- `A ∪ B` : total des films uniques

**Exemple 1 — Match parfait :**

```text
Utilisateur A : [Spider, Pinocchio, Resident Evil]
Utilisateur B : [Spider, Pinocchio, Resident Evil]

|A ∩ B| = 3
|A ∪ B| = 3
Score = (3 / 3) × 100 = 100%  ✅ (≥ 75%)
```

**Exemple 2 — Limite du seuil :**

```text
Utilisateur A : [Spider, Pinocchio, Resident Evil, After]
Utilisateur B : [Spider, Pinocchio, Resident Evil]

|A ∩ B| = 3
|A ∪ B| = 4
Score = (3 / 4) × 100 = 75%  ✅ (limite atteinte)
```

**Exemple 3 — Rejeté :**

```text
Utilisateur A : [Spider, Pinocchio, Resident Evil]
Utilisateur B : [Spider, Pinocchio]

|A ∩ B| = 2
|A ∪ B| = 3
Score = (2 / 3) × 100 = 66%  ❌ (< 75%)
```

---

## 🔒 Authentification et sécurité

- **JWT** : signé avec `JWT_SECRET`, valide 7 jours
- **Mots de passe** : hachés avec `bcryptjs` (10 rounds)
- **Middlewares** :
  - `auth.js` → vérifie le token et l'état `active` du user
  - `admin.js` → vérifie le rôle `admin`
- **Comptes désactivés** : refusés au login ET à chaque requête protégée
- **CORS** : activé via `app.use(cors())` (autorise toutes les origines). En production, restreindre à l'URL du frontend :
  ```js
  app.use(cors({ origin: 'https://ton-frontend.com' }))
  ```
- **Token côté client** : stocké dans `localStorage` (attention aux risques XSS en production)

---

## 📜 Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Démarre avec **nodemon** (rechargement auto) |
| `npm start` | Démarre en mode production |

---

## 🧪 Vérification rapide

### 1. Test de la racine

```bash
curl http://localhost:3000
```

Réponse attendue :

```json
{ "ok": true, "message": "Movie Match API" }
```

### 2. Test du login

**Linux / Mac / Git Bash** :

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"123456"}'
```

**Windows PowerShell** (sur une seule ligne) :

```powershell
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@gmail.com\",\"password\":\"123456\"}"
```

**Ou avec Thunder Client / Postman** :
- Méthode : `POST`
- URL : `http://localhost:3000/api/auth/login`
- Body JSON :
  ```json
  { "email": "admin@gmail.com", "password": "123456" }
  ```

Réponse attendue :

```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": "...", "firstName": "Admin", "role": "admin", ... }
}
```

---

## 👤 Créer un compte administrateur

1. Inscris-toi via le frontend
2. Dans **MongoDB Atlas** → **Browse Collections** → base `moviematch` → collection `users`
3. Trouve ton document → modifie `role` :

```json
{ "role": "admin" }
```

4. **Déconnecte-toi** puis **reconnecte-toi** dans l'app

> 💡 Astuce : la modification du `role` directement dans MongoDB est la méthode la plus rapide pour un projet étudiant. En production, on créerait un script ou une route admin dédiée.

---

## 📌 Remarques

- Les **photos de profil** sont stockées en **Base64** dans le champ `photo` (limite : 900 Ko après compression côté client).
- Les **films** sont identifiés par leur **TMDB ID** (nombre entier).
- La collection `movies` sert de **"base de départ"** modifiable par les admins.
- Le **`.env`** ne doit pas être versionné (utiliser `.env.example`).

---

## ✅ État du backend

| Fonctionnalité | Statut |
|---|---|
| Connexion MongoDB | ✅ |
| Register / Login / Me | ✅ |
| Middleware auth + admin | ✅ |
| Gestion favoris | ✅ |
| Catalogue films (CRUD admin) | ✅ |
| Algorithme Jaccard | ✅ |
| Toggle activation user | ✅ |
| Tous les endpoints testés | ✅ |