# Movie Match — Ionic React

Application Ionic 9 avec React et TypeScript. La migration remplace Angular par des composants React simples, sans bibliothèque de gestion d’état supplémentaire. Ionic, les styles, les plugins Capacitor, les routes et les contrats de l’API restent les mêmes.

## Démarrer

Utiliser Node.js 22.12+ ou 24 LTS. Depuis ce dossier :

```sh
npm install
npm start
```

Ouvrir http://127.0.0.1:4200. `npm run dev` lance également le serveur.

L’API Express existante se trouve dans `../../movie-match-api`. Elle doit être lancée séparément avec sa configuration MongoDB/JWT habituelle pour utiliser les comptes, le catalogue, les favoris et les matchs. La migration ne modifie ni le serveur ni la base de données.

Le fichier `src/environments/environment.ts` conserve la configuration existante. Pour la remplacer localement, créer un fichier `.env.local` :

```dotenv
VITE_API_URL=http://localhost:3000/api
VITE_TMDB_API_KEY=ta_cle_tmdb
```

Ces valeurs de frontend sont publiques. Sur téléphone, l’URL de l’API doit être accessible depuis le téléphone ; `localhost` désigne le téléphone lui-même.

## Structure simple

- `src/pages/` : connexion, inscription, découverte, favoris, matchs, profil et administration.
- `src/components/` : grille de films, caméra, présentation des formulaires et messages.
- `src/AuthContext.tsx` : session partagée et favoris optimistes, avec les mêmes clés `token` et `user` dans le stockage local.
- `src/lib/api.ts` : requêtes HTTP, authentification et délais d’attente.
- `src/lib/movies.ts` : appels MovieDB, cache de dix minutes et chargement limité à quatre favoris à la fois.
- `src/theme/` : thème existant conservé.
- `public/assets/` : ressources statiques.

Les pages utilisent `IonPage`, `IonContent`, `IonToolbar`, `IonSearchbar` et les autres composants Ionic React. `IonReactRouter` et `IonRouterOutlet` conservent la navigation Ionic ; la barre de navigation personnalisée reste identique. React utilise seulement des fonctions, des hooks de base et un contexte partagé.

## Comportements conservés

- Routes `/login`, `/register`, `/tabs/home`, `/tabs/favorites`, `/tabs/matches`, `/tabs/profile` et `/admin` avec contrôle du rôle administrateur.
- Grille d’affiches et bouton cœur ; mise à jour immédiate des favoris et restauration du choix en cas d’échec.
- Inscription avec une photo prise par la caméra. Sur téléphone natif, le même plugin Capacitor ouvre la caméra. Sur navigateur, une prévisualisation vidéo permet de capturer une photo ; aucun sélecteur de fichier n’est proposé. Le navigateur demande l’autorisation et nécessite HTTPS ou localhost. La caméra s’arrête à la capture, à l’annulation ou au départ de la page.
- Ajout de films au catalogue et activation/désactivation des comptes, sans suppression.
- Matching calculé par l’API existante, strictement supérieur à 75 %, avec affichage du score à deux décimales.
- Cache MovieDB, recherche avec délai de 300 ms, protection contre les réponses de recherche obsolètes et les clics répétés sur les favoris.

## Vérifier et construire

```sh
npm test
npm run lint
npm run build
```

Le build vérifie TypeScript et produit `www`, comme auparavant. La configuration `capacitor.config.ts`, l’identifiant d’application et les versions des plugins natifs sont inchangés. Après un build, utiliser `npx cap sync` si les plateformes Android/iOS sont déjà présentes. Les commandes Ionic CLI utilisent désormais le type `react-vite` (CLI 7+).

Les tests vérifient les contrats API, le cache, les sessions existantes, les favoris concurrents, les formulaires, les permissions de route, la capture caméra et l’administration. Les vérifications navigateur peuvent utiliser des réponses API simulées lorsque le serveur local n’est pas configuré ; elles ne remplacent pas un essai sur téléphone réel.

Références : [Ionic React](https://ionicframework.com/docs/react/quickstart), [navigation Ionic React](https://ionicframework.com/docs/react/navigation), [cycle de vie Ionic](https://ionicframework.com/docs/react/lifecycle), [Ionic CLI et Vite](https://ionic.io/blog/ionic-cli-v7), [effets React](https://react.dev/reference/react/useEffect).
