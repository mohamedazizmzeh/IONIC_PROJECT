# Movie Match — API et modifications en direct

[Retour à la fiche principale](./CHEAT_SHEET.md) · [Ionic et hooks](./CHEAT_SHEET_IONIC_REACT.md). Les exercices ci-dessous ne modifient pas l’application tant que tu ne les appliques pas.

## Les deux circuits réseau à distinguer

| | MovieDB / TMDB | Notre backend Express |
|---|---|---|
| Rôle | Populaires, recherche, détails et chemins d’affiches | Comptes, favoris, catalogue et matching |
| Point d’entrée frontend | `src/lib/movies.ts` → `requestJson()` | `api()` dans `src/lib/api.ts` |
| URL de base | Configuration `environment.tmdb.baseUrl` | `VITE_API_URL` ou `environment.apiUrl`, normalement `http://localhost:3000/api` |
| Authentification ajoutée par notre frontend | Clé TMDB dans les paramètres de requête | JWT dans `Authorization: Bearer ...`, sauf login/register |
| Stockage durable de nos données | Ne stocke pas nos comptes ni nos favoris | MongoDB via Mongoose |

**Important :** les populaires et les résultats de recherche ne sont pas automatiquement copiés dans MongoDB. Un admin sélectionne un film à ajouter au catalogue. Un favori conserve son ID TMDB ; ses détails sont chargés avec `getMovie(id)`.

## Les endpoints réellement présents

Le préfixe **`/api`** est ajouté par `server.js`. Les chemins transmis à `api()` commencent après ce préfixe.

| Méthode + chemin complet | Accès | Corps / réponse utile | Appelant frontend |
|---|---|---|---|
| POST `/api/auth/register` | Public | `{ firstName, lastName, age, email, password, photo }` → `{ token, user }`, statut 201 | `AuthContext.register` |
| POST `/api/auth/login` | Public | `{ email, password }` → `{ token, user }` | `AuthContext.login` |
| GET `/api/auth/me` | Connecté actif | → `AppUser` | Effet initial de `AuthProvider` |
| GET `/api/movies` | Connecté actif | → tableau de films MongoDB | `getCatalog()` |
| POST `/api/movies` | Admin actif | Données du film → document créé, statut 201 | `Admin.add` |
| DELETE `/api/movies/:id` | Admin actif | `id` désigne ici le **tmdbId** → `{ ok: true }` | Endpoint présent, sans bouton dans l’UI actuelle |
| GET `/api/users` | Admin actif | → tableau d’utilisateurs sans mot de passe | Effet de `Admin` |
| PATCH `/api/users/:id/toggle-active` | Admin actif | Pas de corps nécessaire → `{ id, active }` | `Admin.toggleActive` |
| POST `/api/users/favorites/:movieId` | Connecté actif | Corps `{}` envoyé actuellement → `{ favorites }` | `AuthContext.toggleFavorite` |
| DELETE `/api/users/favorites/:movieId` | Connecté actif | → `{ favorites }` | `AuthContext.toggleFavorite` |
| PUT `/api/users/photo` | Connecté actif | `{ photo }` → `{ photo }` | Endpoint présent, pas de modification photo dans le profil actuel |
| GET `/api/matches?threshold=75` | Connecté actif | → tableau `{ user, score, common }` | Effet de `Matches` |

`GET /` du backend retourne un message de santé, en dehors du préfixe `/api`.

## Questions sur `api.ts`

**Où est réellement `fetch` ?** Dans `requestJson()`. Les écrans passent par des fonctions qui centralisent le traitement HTTP.

**Pourquoi ne pas utiliser `api()` pour MovieDB ?** Cette fonction ajoute l’URL de notre serveur et le token de notre application. `requestJson()` permet d’appeler l’URL externe sans lui ajouter automatiquement ce token.

**Comment envoyer du JSON ?** Avec `body: JSON.stringify(data)`. `api()` ajoute `Content-Type: application/json` lorsqu’un corps est fourni. Le serveur utilise `express.json({ limit: '2mb' })` pour lire `req.body`.

**GET est-il écrit partout ?** Non. Sans `method`, `fetch` utilise GET. La recherche envoie son texte dans les paramètres de l’URL, pas dans un corps GET.

**Un statut 400 rejette-t-il automatiquement `fetch` ?** Non. Notre helper vérifie `response.ok` et lance `ApiError`, en conservant `status` et le message JSON du serveur.

**Quelles erreurs distingue-t-on ?** Erreur HTTP : message serveur + statut. Réseau indisponible : message de connexion. Délai dépassé : message d’attente trop longue. Annulation volontaire : erreur nommée `AbortError`.

**Quels délais ?** Notre API reçoit 12 secondes ; `requestJson()` utilise 10 secondes par défaut pour les appels MovieDB. Le timer et l’écouteur d’annulation sont nettoyés dans `finally`.

**`api<Movie[]>()` valide-t-il le JSON ?** Non. Le type aide TypeScript pendant le développement. `requestJson` termine par une assertion de type ; il n’effectue pas de validation complète de la structure reçue.

**Les appels échoués sont-ils tous relancés automatiquement ?** Non. L’interface propose « Réessayer ». Cela évite notamment de répéter automatiquement une écriture.

**Que signifie `signal` ?** C’est un `AbortSignal` fourni par la page. Le helper le relaie à son propre contrôleur pour combiner annulation de page et délai maximal.

## Questions sur les données, le cache et la sécurité du parcours

**Où sont les types ?** `src/types.ts` définit `Movie`, `CatalogMovie`, `AppUser`, `AuthResponse`, `RegisterData`, `MatchResult`. Les schémas réellement enregistrés en base sont dans `movie-match-api/models`.

**Pourquoi adapter le catalogue ?** MongoDB renvoie `tmdbId`, `posterPath`, `releaseDate`, `voteAverage`. La grille attend `id`, `poster_path`, `release_date`, `vote_average`. `getCatalog()` fait cette correspondance pour réutiliser la même grille.

**Pourquoi un cache de promesses ?** Deux appels au même film avant sa réponse partagent la même requête. Deux Maps conservent listes et détails pendant 10 minutes, avec au maximum 100 entrées chacune. Une promesse rejetée est retirée ; ce cache est en mémoire et disparaît au rechargement.

**Le catalogue MongoDB est-il dans ce cache ?** Non. `getCatalog()` appelle directement notre API. Les caches concernent les listes et détails MovieDB.

**Pourquoi seulement quatre détails de favoris à la fois ?** `loadFavoriteMovies()` limite les requêtes simultanées. Dès qu’une place se libère, le film suivant démarre. Les résultats gardent l’ordre des IDs, les doublons sont supprimés et une erreur partielle n’empêche pas les autres films d’apparaître.

**Comment sont enregistrés les favoris ?** Le serveur utilise `$addToSet` pour ajouter un ID sans doublon et `$pull` pour le retirer, à partir de l’utilisateur du token. Le client n’envoie pas un autre `userId` pour décider à qui ajouter le favori.

**Le mot de passe est-il stocké en clair ?** Non. `auth.controller.js` le hache avec `bcrypt.hash(password, 10)` et le compare avec `bcrypt.compare`. `sanitize()` retire le mot de passe de la réponse.

**Que contient le JWT créé ici ?** Un identifiant utilisateur, signé avec `JWT_SECRET` et une expiration issue de `JWT_EXPIRES`. Le middleware vérifie le token puis recharge le compte MongoDB. Le rôle n’est pas décidé par une valeur de l’interface.

**Est-ce que modifier `role` dans localStorage donne vraiment le droit d’ajouter un film ?** Cela peut tromper l’affichage local, mais le middleware admin vérifie le rôle du compte en base avant l’écriture. La protection frontend ne remplace pas celle du serveur.

**À la déconnexion, le token est-il révoqué côté serveur ?** Non. Le frontend retire `token` et `user` du stockage et de son état. Le projet n’a pas de liste de révocation de tokens ; le serveur vérifie expiration et état du compte.

**Les clés `VITE_*` sont-elles secrètes ?** Non, elles sont intégrées au frontend. `JWT_SECRET` et `MONGO_URI` appartiennent à l’environnement backend, pas à la configuration Vite publique.

## Exercices : « change cet appel API »

### 1. Changer l’adresse de notre API

Dans `.env.local` du frontend :

```dotenv
VITE_API_URL=https://serveur-exemple.test/api
```

Redémarrer `npm start`. Conserver `/api` si le serveur expose ce préfixe. Ne pas ajouter `/api` une deuxième fois dans `api('/movies')`. Si la nouvelle API n’a pas les mêmes routes ou réponses, changer aussi les fonctions concernées, pas uniquement l’adresse.

### 2. Afficher les films les mieux notés à la place des populaires

Dans `src/lib/movies.ts`, conserver le nom `getPopular()` pour éviter de modifier son appelant, mais changer **l’endpoint et la clé du cache** :

```tsx
export function getPopular() {
  return cached(lists, 'top-rated', async () =>
    (await requestJson<{ results: Movie[] }>(movieUrl('/movie/top_rated'))).results
  );
}
```

Dans `Home.tsx`, renommer le texte visible « Populaires » en « Les mieux notés ». Pour une modification durable, renommer aussi la fonction et ses imports améliore la cohérence. L’endpoint est décrit dans la [référence officielle TMDB Top Rated](https://developer.themoviedb.org/reference/movie-top-rated-list) ; vérifier aussi la structure de réponse avant de changer de service.

### 3. Changer la langue MovieDB

Dans `movieUrl()` de `movies.ts`, remplacer `language: 'fr-FR'` par `language: 'en-US'`. Cela concerne les données MovieDB, pas les libellés français écrits dans les composants. Vider le cache ou recharger complètement la page pour éviter d’afficher une ancienne réponse.

### 4. Adapter une réponse `{ movies: [...] }` au lieu d’un tableau direct

Dans `getCatalog()`, remplacer la lecture initiale, puis conserver le `map` existant :

```tsx
const response = await api<{ movies: CatalogMovie[] }>('/movies', { signal });
const movies = response.movies;
```

Si c’est notre serveur qui change, `movie.controller.js` doit aussi renvoyer `res.json({ movies })`. Modifier uniquement le type TypeScript ne transforme pas la réponse réseau.

### 5. Remplacer un GET par un POST de recherche

Seulement si le serveur demandé accepte **POST `/movies/search`** avec un corps `{ query }` :

```tsx
const results = await api<Movie[]>('/movies/search', {
  method: 'POST',
  body: JSON.stringify({ query })
});
```

Cette route n’existe pas dans notre backend actuel. Il faut l’implémenter dans `routes/movie.routes.js` et son controller, ou utiliser une API qui la fournit déjà. Ne pas changer GET en POST en supposant que le serveur s’adapte automatiquement.

### 6. Ajouter un paramètre de page MovieDB

Dans `movieUrl`, accepter un troisième argument `page = 1`, puis ajouter `params.set('page', String(page))`. Dans `getPopular(page = 1)`, transmettre `page` à `movieUrl('/movie/popular', undefined, page)` et utiliser une clé comme `` `popular:${page}` ``. Ensuite seulement ajouter l’état `page` et sa dépendance dans `Home`. Sans la page dans la clé, le cache pourrait renvoyer les films d’une autre page.

### 7. Passer le matching à « strictement plus de 80 % »

Dans `Matches.tsx`, changer `/matches?threshold=75` en `/matches?threshold=80`, le texte « Seuil > 75% » et l’explication de l’état vide. Adapter le test dans `Account.test.tsx`. Le backend utilise déjà `.filter(m => m.score > threshold)` : ne pas introduire `>=` ni arrondir avant ce filtre.

Pour rendre **80 obligatoire côté serveur**, changer aussi le minimum dans `Math.max(75, ...)` et la valeur de remplacement `|| 75` de `match.controller.js`, puis ses tests. Pour accepter 60, changer seulement le frontend ne suffit pas : le serveur impose actuellement un minimum de 75.

### 8. Ajouter la durée d’un film

Dans `Movie` de `types.ts`, ajouter `runtime?: number` si la réponse utilisée fournit cette donnée. Ajouter le JSX dans `MovieGrid`. Si les listes populaires/recherche ne fournissent pas `runtime`, l’ajout d’un type ne créera pas la donnée : il faut charger les détails ou enrichir la réponse. Pour la conserver dans le catalogue, adapter aussi `CatalogMovie`, `getCatalog`, le corps POST de `Admin.add`, le controller et le modèle `Movie.js`.

### 9. Ajouter la suppression d’un film du catalogue à l’écran admin

L’API existe déjà :

```tsx
await api(`/movies/${movie.id}`, { method: 'DELETE' });
setAddedIds((ids) => ids.filter((id) => id !== movie.id));
```

À intégrer dans `Admin`, avec confirmation, gestion d’erreur et blocage des doubles clics comme pour l’ajout. Ici `movie.id` est l’ID TMDB. Supprimer du catalogue ne retire pas automatiquement ce film des favoris de tous les comptes : le controller actuel ne fait pas cette opération.

### 10. Utiliser le endpoint de modification de photo

L’appel serait `api<{ photo: string }>('/users/photo', { method: 'PUT', body: JSON.stringify({ photo }) })`. Il faudrait ensuite ajouter une méthode au contexte pour synchroniser le nouvel utilisateur dans `user`, `userRef` et `localStorage`, l’exposer via `useAuth`, et ajouter la capture au profil. Cet écran de modification n’existe pas actuellement ; l’inscription utilise directement son POST avec la photo.

### 11. Changer la qualité / taille de la photo

Dans `CameraCapture.tsx`, branche native : `quality: 70`, `targetWidth: 300`, `targetHeight: 300`. Branche navigateur : facteur d’échelle limité à 300 pixels et `canvas.toDataURL('image/jpeg', 0.7)`. Modifier les deux branches si le changement doit être identique sur téléphone natif et navigateur. Le client et le serveur refusent une chaîne photo de plus de 900 000 caractères ; la limite n’est pas un nombre de pixels.

### 12. Afficher une autre donnée de la réponse

Exemple : afficher l’email d’un match. `MatchResult.user` et le JSON du controller de matching ne contiennent actuellement pas l’email. Il faut d’abord décider de l’exposer dans ce controller, modifier le type `Pick<AppUser, ...>` puis l’afficher dans `Matches.tsx`. Changer uniquement le JSX produirait une erreur TypeScript ou une valeur absente.

## Méthode à dire à voix haute quand on te demande une modification

« Je vérifie l’URL, la méthode, les paramètres, le corps, l’authentification et le JSON retourné. Je modifie la fonction qui porte cet appel. Si le format change, j’adapte les types et la transformation vers l’interface. Si une entrée change le résultat mis en cache, je la mets aussi dans la clé. Je vérifie le chargement, l’erreur et une réponse arrivée en retard. »

Pour pratiquer : onglet Réseau du navigateur, appel concerné, statut HTTP et forme du JSON ; éviter d’afficher les tokens ou clés. Tester le changement avec les fichiers `src/lib/*.test.ts`, `AuthContext.test.tsx`, `src/pages/*.test.tsx` ou `CameraCapture.test.tsx` selon le parcours, puis `npm run build` et `npm run lint`. Pour le matching, utiliser aussi `movie-match-api/controllers/match.controller.test.js`.
