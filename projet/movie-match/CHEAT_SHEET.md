# Movie Match — fiche de soutenance

Réponses adaptées au code de ce projet. Les exemples de modification sont des exercices : ils ne sont pas appliqués à l’application. Aucun document ne peut prévoir toutes les questions, mais ces fiches couvrent les parcours et changements les plus probables.

**Parcours de révision :** cette page pour la vue d’ensemble, [Ionic et hooks React](./CHEAT_SHEET_IONIC_REACT.md) pour expliquer le frontend, puis [API et modifications en direct](./CHEAT_SHEET_API.md) pour pratiquer.

## Présenter le projet en 30 secondes

« Movie Match est une application Ionic React de gestion des films. React gère les composants, les formulaires et l’état. Ionic fournit les composants d’interface et la navigation mobile. Capacitor permet d’utiliser la caméra native. MovieDB fournit les films populaires, la recherche et les détails. Notre API Express stocke les utilisateurs, leurs favoris et le catalogue dans MongoDB. Le matching est calculé côté serveur avec l’indice de Jaccard, strictement supérieur à 75 %. »

## Les fichiers à savoir retrouver

Les chemins frontend sont relatifs à `projet/movie-match`. Le backend se trouve dans `../../movie-match-api`.

| Si le professeur demande… | Ouvrir… |
|---|---|
| Où démarre React et Ionic ? | [src/main.tsx](./src/main.tsx) |
| Où sont les routes et leurs protections ? | [src/App.tsx](./src/App.tsx) |
| Où sont les quatre liens de navigation ? | [src/pages/Tabs.tsx](./src/pages/Tabs.tsx) |
| Où sont les appels HTTP communs ? | [src/lib/api.ts](./src/lib/api.ts) |
| Où sont les appels MovieDB et le cache ? | [src/lib/movies.ts](./src/lib/movies.ts) |
| Où changer la session et les favoris ? | [src/AuthContext.tsx](./src/AuthContext.tsx) |
| Où changer les formulaires ? | [Login.tsx](./src/pages/Login.tsx), [Register.tsx](./src/pages/Register.tsx) |
| Où changer la recherche de films ? | [src/pages/Home.tsx](./src/pages/Home.tsx) |
| Où changer l’affiche et le bouton cœur ? | [src/components/MovieGrid.tsx](./src/components/MovieGrid.tsx) |
| Où charger les films favoris ? | [src/pages/Favorites.tsx](./src/pages/Favorites.tsx) |
| Où afficher les correspondances ? | [src/pages/Matches.tsx](./src/pages/Matches.tsx) |
| Où ajouter un film / désactiver un utilisateur ? | [src/pages/Admin.tsx](./src/pages/Admin.tsx) |
| Où ouvrir et arrêter la caméra ? | [src/components/CameraCapture.tsx](./src/components/CameraCapture.tsx) |
| Où sont les interfaces TypeScript ? | [src/types.ts](./src/types.ts) |
| Où changer les couleurs ? | [src/theme/variables.scss](./src/theme/variables.scss) |
| Où changer l’adresse du serveur ? | `.env.local` : `VITE_API_URL`, sinon `src/environments/environment.ts` |
| Où changer la règle de matching ? | [match.controller.js](../../movie-match-api/controllers/match.controller.js) |
| Où vérifier le token et le compte actif ? | [middleware/auth.js](../../movie-match-api/middleware/auth.js) |
| Où vérifier le rôle admin ? | [middleware/admin.js](../../movie-match-api/middleware/admin.js) |

## Expliquer les cinq parcours

| Action | Parcours réel |
|---|---|
| Se connecter | `Login.submit` → `useAuth().login` → `api('/auth/login', POST)` → Express → comparaison bcrypt → réponse `{ token, user }` → stockage + état → `/tabs/home` |
| Rechercher | `IonSearchbar` → attente de 300 ms → `setQuery` → effet de `Home` → `searchMovies` → cache ou MovieDB → `setMovies` → `MovieGrid` |
| Aimer un film | `MovieGrid.toggle` → `toggleFavorite` du contexte → mise à jour immédiate → POST/DELETE backend → MongoDB ; restauration du film concerné si échec |
| S’inscrire | `Register` → `CameraCapture` → photo JPEG en data URL → validation → POST inscription → hash du mot de passe + sauvegarde MongoDB → connexion automatique |
| Trouver des matchs | `Matches` → GET `/matches?threshold=75` → utilisateurs actifs → intersection/union des favoris → filtre strict → tri décroissant → affichage du score |

## Questions sur les exigences du mini-projet

**Firebase est-il utilisé ?** Non. Notre choix est une API Express et MongoDB, ce que le sujet autorise. `localStorage` conserve une copie de session ; ce n’est pas la base de données partagée.

**Chaque utilisateur a-t-il sa playlist ?** Oui. `User.favorites` contient son tableau d’identifiants TMDB. Il s’agit d’une collection de favoris par compte ; le projet ne gère pas plusieurs playlists nommées.

**Où est la photo ?** Dans `User.photo`, sous forme de chaîne data URL/base64. Il n’y a pas de stockage de fichiers séparé dans ce parcours.

**Peut-on téléverser une image à l’inscription ?** L’interface propose seulement la capture caméra. Sur navigateur, elle utilise une vidéo et un canvas ; sur plateforme native, `Camera.takePhoto`.

**Le serveur prouve-t-il que la photo vient d’une caméra ?** Non. Il vérifie sa présence et sa taille, pas sa provenance matérielle. La contrainte de capture est imposée par le parcours de l’interface.

**La caméra native a-t-elle été validée sur téléphone ?** Les appels au plugin ont été testés par simulation. La capture navigateur a aussi été vérifiée avec un flux vidéo simulé. Cela ne prouve pas une validation matérielle Android/iOS ; il faut un essai sur appareil.

**L’admin supprime-t-il les utilisateurs ?** Non. PATCH `/users/:id/toggle-active` inverse `active`. Le document MongoDB reste présent. Le backend propose séparément une suppression de film du catalogue, pas une suppression d’utilisateur.

**Un utilisateur désactivé avec un ancien token peut-il encore utiliser l’API ?** Le middleware recharge le compte à chaque requête protégée et refuse `active === false` avec 403.

**Comment obtenir un compte admin ?** Le modèle attribue `role: 'user'` par défaut. L’inscription publique ne prend pas en compte un rôle envoyé par le client. Il faut un compte dont le rôle a été configuré côté base de données ; aucune interface de promotion admin n’est prévue.

**Le matching est-il « films communs / mes favoris » ?** Non. C’est `intersection / union × 100`, avec des ensembles pour le score.

| Mes favoris A | Autre liste B | Calcul | Résultat au seuil 75 |
|---|---|---|---|
| `[1,2,3,4]` | `[1,2,3]` | `3 / 4 × 100 = 75` | Refusé |
| `[1,2,3,4]` | `[1,2,3,4,5]` | `4 / 5 × 100 = 80` | Accepté |
| `[1,2,3,4]` | `[1,2,3,4]` | `4 / 4 × 100 = 100` | Accepté |
| `[]` | `[1,2]` | Score défini à 0 | Refusé |

**Pourquoi un score affiché à 75.00 % pourrait-il être accepté ?** L’API filtre le score exact avant l’affichage. Un score réel légèrement supérieur à 75 peut devenir `75.00` avec `toFixed(2)`. Il ne faut pas arrondir avant la comparaison.

**À quoi servent `score` et `common` ?** `score` est le pourcentage de Jaccard ; `common` est le nombre de films communs. L’API exclut le compte courant et les autres comptes inactifs, puis trie les matchs par score décroissant.

## Ne pas confondre ces notions

| Notion | Dans notre projet |
|---|---|
| React / Ionic / Capacitor | État et rendu / interface et navigation / accès natif |
| `Movie.id` / `CatalogMovie._id` | ID TMDB numérique / ID du document MongoDB |
| `CatalogMovie.tmdbId` / `AppUser.id` | Référence TMDB / identifiant du compte MongoDB exposé comme `id` |
| `useEffect(..., [])` / entrée sur une page | Montage du composant / événement de navigation Ionic |
| `useState` / `useRef` | Changement qui met à jour le rendu / valeur conservée sans déclencher le rendu |
| `api()` / `requestJson()` | URL backend + JWT + 12 s / HTTP générique, sans ajout automatique de JWT, 10 s par défaut |
| Masquer le bouton admin / autoriser une action | Confort d’interface / décision réellement vérifiée côté serveur |
| `Movie[]` / `{ results: Movie[] }` | Tableau de l’application / enveloppe des listes MovieDB |
| Cache / `localStorage` | Films en mémoire pendant la session de page web / session conservée après rechargement |

## Diagnostiquer pendant la démonstration

| Symptôme | Première vérification |
|---|---|
| La page fonctionne mais la connexion échoue | API sur le port 3000 ; `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES` dans l’environnement serveur |
| Populaires fonctionne mais catalogue/favoris échoue | Les populaires viennent de MovieDB ; les données personnelles passent par notre API protégée |
| Recherche OK mais affiches absentes | URL d’image construite par `poster()` ; champ `poster_path` ; réseau images séparé du JSON |
| Recherche MovieDB refusée | Clé TMDB et URL, sans afficher la clé pendant la présentation |
| Ancien résultat après une recherche | Vérifier le nettoyage `active = false` dans l’effet et la clé du cache |
| Caméra impossible | Permission, caméra disponible, HTTPS/localhost, distinction navigateur / application native |
| Fonctionne sur PC, API inaccessible sur téléphone | `localhost:3000` désigne le téléphone ; utiliser une adresse de serveur accessible depuis l’appareil |
| Nouveau champ invisible | Vérifier réponse JSON → adaptation → interface TypeScript → JSX |
| Aucun match | Comptes actifs différents, listes non vides, score exact strictement supérieur à 75 |
| Le changement d’URL n’a aucun effet | Redémarrer Vite après modification de `.env.local` ; vérifier une éventuelle réponse déjà en cache |

## Commandes à connaître

Depuis `projet/movie-match` :

```sh
npm start
npm test
npm run lint
npm run build
```

Le frontend utilise le port **4200**. Le build vérifie TypeScript puis écrit dans **`www`**. Depuis `movie-match-api`, `npm start` lance Express sur **3000** par défaut et `npm test` lance les tests backend. Le serveur a besoin de sa configuration MongoDB/JWT.

`capacitor.config.ts` conserve `appId: 'io.ionic.starter'`, `appName: 'movie-match'`, `webDir: 'www'`. `npx cap sync` synchronise un build vers les plateformes natives déjà installées ; ce n’est pas une commande de démarrage du serveur web.

## Répétition pratique : huit demandes à savoir exécuter

1. Expliquer le `useEffect` de `Home`, dépendance par dépendance.
2. Remplacer les populaires par les films les mieux notés sans casser le cache.
3. Montrer où un GET devient un POST avec un corps JSON.
4. Adapter une réponse API enveloppée dans `{ movies: [...] }`.
5. Changer le délai de recherche et afficher une note avec `IonBadge`.
6. Ajouter une page Ionic et son lien dans la navigation existante.
7. Expliquer pourquoi on ne remplace pas tous les favoris par une réponse arrivée en retard.
8. Passer le matching à un seuil strict de 80 et identifier tous les fichiers concernés.

Les solutions se trouvent dans les deux fiches liées en haut de cette page.
