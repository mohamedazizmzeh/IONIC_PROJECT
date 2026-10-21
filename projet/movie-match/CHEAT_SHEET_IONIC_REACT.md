# Movie Match — Ionic, React et hooks

[Retour à la fiche principale](./CHEAT_SHEET.md) · [Exercices API](./CHEAT_SHEET_API.md). Les chemins ci-dessous partent du dossier frontend.

## Ionic : les questions qui visent notre code

| Question | Réponse à donner / fichier à montrer |
|---|---|
| Où Ionic est-il initialisé ? | `src/main.tsx` appelle `setupIonicReact()`, charge les styles puis `createRoot(...).render(<App />)` |
| React remplace-t-il Ionic ? | Non. Les composants viennent de `@ionic/react` ; Angular a été remplacé par React pour le rendu et l’état |
| Que contient `App` ? | `IonApp`, une frontière d’erreur, `AuthProvider`, `IonReactRouter`, puis `IonRouterOutlet` et les routes |
| Pourquoi `IonPage` ? | C’est le conteneur de page attendu par la navigation Ionic pour sa disposition et ses transitions. `Home`, `Matches`, etc. l’utilisent |
| Pourquoi `AuthLayout` contient-il `IonPage` ? | Les pages connexion et inscription partagent cette enveloppe ; elles ne rajoutent pas une deuxième `IonPage` dans leur formulaire |
| `IonHeader`, `IonToolbar`, `IonTitle` ? | En-tête, barre de contenu et titre, par exemple dans `Home.tsx` |
| `IonContent` ? | Zone de contenu défilante de la page, séparée de son en-tête |
| `IonReactRouter` / `IonRouterOutlet` ? | Le routeur relie les URL à React Router ; l’outlet Ionic participe à la gestion des pages et transitions |
| Utilisons-nous `IonTabs` ? | Non. `Tabs.tsx` utilise une navigation HTML personnalisée avec `NavLink` et un outlet Ionic imbriqué |
| Comment le lien actif est-il coloré ? | `NavLink` calcule `isActive`, puis ajoute la classe `active` ; `Tabs.scss` gère l’aspect |
| Barre latérale ou navigation basse ? | Le même `Tabs.scss` utilise une media query à 900 px pour passer en barre latérale |
| À quoi sert `slot="end"` ? | À placer un élément dans l’emplacement de fin d’un composant Ionic : badge du profil ou seuil dans la toolbar des matchs |
| Comment fonctionne le retour admin ? | `IonBackButton` dans `IonButtons slot="start"`, avec `defaultHref="/tabs/profile"` si aucun historique approprié |
| Le chargement utilise-t-il une bibliothèque supplémentaire ? | Non. `Loading` dans `Feedback.tsx` affiche un `IonSpinner` et un texte ; les pages pilotent leur état `loading` |
| Les photos et scores utilisent quoi ? | `IonAvatar` et `IonBadge` dans profil, admin et matchs |
| Comment changer le thème ? | Variables `--mm-*` et `--ion-*` dans `src/theme/variables.scss`, styles globaux dans `src/global.scss`, styles de page dans `src/pages/*.scss` |

**Piège : revenir sur une page ne signifie pas forcément la remonter.** Ionic peut conserver une page dans le DOM. Un effet React avec `[]` n’est donc pas un « à chaque visite ». Pour la caméra, le projet combine le nettoyage au démontage et `useIonViewWillLeave(() => closeCamera())`. Voir le [cycle de vie Ionic](https://ionicframework.com/docs/react/lifecycle).

## Les hooks réellement utilisés

| Hook | Exemple réel | Ce qu’il faut expliquer |
|---|---|---|
| `useState` | `query`, `movies`, `loading`, `error` dans `Home.tsx` | Un setter met à jour l’état pour un prochain rendu. Une variable locale seule ne conserve pas cet état entre rendus |
| `useEffect` | Chargement des films dans `Home.tsx` | Synchronise l’affichage avec une requête ; dépend de l’onglet, de la recherche et de la relance |
| `useRef` | `video`, `stream`, `request` dans `CameraCapture.tsx` | Conserve un élément DOM, une ressource et un compteur ; modifier `.current` ne redessine pas l’interface |
| `useRef` | `userRef` et `pending` dans `AuthContext.tsx` | Lit l’utilisateur courant dans les opérations asynchrones et bloque immédiatement les doubles opérations sur un film |
| `useContext` | Dans le hook personnalisé `useAuth()` | Lit l’unique session partagée exposée par `AuthProvider` |
| `useNavigate` | `Login`, `Register`, `Profile` | Change la route après connexion, inscription, déconnexion ou ouverture admin |
| `useIonViewWillLeave` | `CameraCapture.tsx` | Ferme le flux caméra quand on quitte la page, même si Ionic conserve son composant |

`createContext` crée le contexte ; ce n’est pas un hook. `useAuth` est notre hook personnalisé. `useNavigate` vient de React Router et `useIonViewWillLeave` d’Ionic. Le projet n’utilise pas Redux, `useReducer`, `useMemo` ou `useCallback` pour gérer ses écrans.

**Où appeler les hooks ?** Au niveau supérieur du composant ou d’un autre hook. Dans `MovieGrid`, garder `useAuth()` avant le `map`, pas à l’intérieur de chaque carte ou d’un `if`. Les appels doivent conserver le même ordre entre les rendus.

## Savoir expliquer `Home` ligne par ligne

```tsx
const [query, setQuery] = useState('');
const [movies, setMovies] = useState<Movie[]>([]);
```

**Pourquoi deux états ?** `query` est la saisie qui déclenche la recherche ; `movies` est son résultat. Le tableau vide est une valeur initiale valable avant l’arrivée du réseau.

```tsx
<IonSearchbar
  value={query}
  onIonInput={(e) => setQuery(e.detail.value ?? '')}
  debounce={300}
/>
```

**Pourquoi `detail.value`, pas `target.value` ?** C’est le contrat de l’événement Ionic utilisé ici. Les champs HTML des formulaires utilisent `onChange` et `e.target.value`.

**Pourquoi `?? ''` ?** La valeur Ionic peut être absente ; notre état reste une chaîne. **Pourquoi 300 ?** Pour retarder l’émission de `ionInput` et éviter de rechercher à chaque frappe immédiate. Modifier `debounce={500}` dans `Home.tsx` et aussi `Admin.tsx` si les deux recherches doivent changer.

**Que signifie `[tab, query, retry]` ?** L’effet charge les films au montage puis se relance si une de ces valeurs change. `popular` + recherche vide appelle `getPopular()`, recherche non vide appelle `searchMovies(query)`, onglet catalogue appelle `getCatalog(signal)`.

**Quand le nettoyage est-il exécuté ?** Avant de relancer l’effet avec des dépendances modifiées, puis au démontage. Un effet sans tableau de dépendances se relancerait après chaque rendu concerné ; ce n’est pas la configuration utilisée pour charger nos films.

**Que fait le premier effet `[]` de Home ?** Il charge séparément le nombre de films du catalogue. Un changement de recherche ne le relance pas.

**Pourquoi `active = false` dans le nettoyage ?** Une ancienne promesse peut se terminer après une nouvelle recherche. Son résultat est ignoré pour ne pas écraser les nouveaux films.

**Pourquoi aussi `controller.abort()` ?** L’appel catalogue reçoit le signal et peut être annulé. Les appels MovieDB sont partagés par le cache et ne reçoivent pas ce signal de page : `active` empêche leur résultat obsolète d’être affiché, sans annuler la requête partagée.

**Pourquoi ne pas écrire `useEffect(async () => {...})` ?** Le callback doit pouvoir retourner une fonction de nettoyage, pas une promesse. Notre code lance des promesses dans un callback synchrone. React décrit cette gestion du nettoyage dans [useEffect](https://react.dev/reference/react/useEffect).

**Pourquoi ne pas ajouter `movies` aux dépendances ?** L’effet produit `movies` avec `setMovies`. Le faire dépendre de son propre résultat pourrait provoquer des relances inutiles ou une boucle.

**Pourquoi un compteur `retry` ?** Incrémenter ce compteur provoque une nouvelle exécution de l’effet, même si l’onglet et la recherche sont identiques. Un cache valide peut toutefois répondre sans nouvel appel HTTP.

## Session et favoris : les questions React importantes

**Pourquoi un contexte ?** La grille, les favoris et le profil lisent le même utilisateur. `AuthProvider` englobe le routeur dans `App.tsx`, donc les pages utilisent `useAuth()` au lieu de transmettre la session à travers toutes les props.

**Pourquoi `useState(storedUser)` sans parenthèses ?** C’est une initialisation paresseuse : React appelle la fonction pour initialiser l’état. Le stockage n’est pas reparsé à chaque rendu ordinaire.

**Pourquoi garder `user` et `userRef` ?** `user` déclenche le rendu. `userRef.current` est mis à jour immédiatement et sert aux traitements asynchrones pour travailler sur la version courante plutôt que sur une ancienne valeur capturée.

**Peut-on lire la nouvelle valeur juste après `setUser` ?** La variable `user` du rendu en cours garde son ancienne valeur. `await setUser(...)` ne résout pas cela. Le projet utilise une variable calculée ou `userRef.current` pour les traitements immédiats ; un setter fonctionnel comme `setAddedIds(ids => [...ids, movie.id])` calcule depuis l’état précédent.

**Pourquoi un `Set` dans une ref et un tableau `pendingFavorites` dans l’état ?** Le Set bloque une deuxième opération sur le même film immédiatement ; l’état permet d’afficher son bouton désactivé. Les deux ont des rôles différents.

**Que se passe-t-il quand je clique sur deux films rapidement ?** Les opérations de deux IDs différents sont autorisées. Le contexte modifie chaque ID séparément. En cas d’échec, il restaure uniquement le choix de ce film.

**Pourquoi ignorer la liste de favoris renvoyée par chaque POST/DELETE ?** Une réponse ancienne peut arriver après une autre et contenir une liste dépassée. Le contexte garde ses modifications locales par ID au lieu de remplacer toute la collection par cette liste.

**Pourquoi `new Set(current.favorites)` ?** Cela crée une copie qui évite les doublons. Puis `{ ...current, favorites: [...favorites] }` crée un nouvel objet utilisateur pour mettre à jour l’état sans modifier directement l’ancien.

**Pourquoi `localStorage.setItem()` seul ne suffit-il pas ?** React ne redessine pas automatiquement quand le stockage change. Le code met aussi à jour `userRef` et appelle `setUser`.

**Quels effets actualisent les pages personnelles ?** `Favorites` dépend de `[ids, retry]`, où `ids` est la liste des IDs jointe en chaîne. `Matches` dépend de `[favorites, retry]`. Le contenu des favoris peut ainsi déclencher leur actualisation même si les pages restent montées.

**Pourquoi ne pas dépendre du nombre de favoris seulement ?** Retirer un film et en ajouter un autre peut conserver le même nombre tout en changeant la collection.

## JSX et formulaires : questions à partir des écrans

| Question | Réponse dans le projet |
|---|---|
| Props de `MovieGrid` ? | `movies` apporte les données ; `onError` permet au composant enfant de demander au parent d’afficher une erreur |
| Comment la caméra transmet-elle sa photo ? | `onPhoto(dataURL)` ; `Register` passe son setter `setPhoto` en prop |
| Comment l’inscription sait-elle que la caméra est ouverte ? | `onBusyChange` → `setCameraBusy` ; le bouton submit est désactivé pendant l’ouverture et la capture |
| Pourquoi `key={movie.id}` ? | Pour identifier chaque film de manière stable dans la liste React ; l’index n’identifie pas le même film après une suppression ou un tri |
| Pourquoi `map()` ? | Pour transformer le tableau de films en cartes JSX |
| Pourquoi `onClick={() => toggle(movie.id)}` ? | On transmet une fonction à exécuter au clic. `onClick={toggle(movie.id)}` l’exécuterait pendant le rendu |
| Pourquoi `event.preventDefault()` ? | Pour envoyer le formulaire avec notre code sans navigation/rechargement HTML classique |
| Pourquoi `value` + `onChange` ? | Les champs sont contrôlés par l’état de `Login` ou `Register` |
| Pourquoi `Number(fields.age)` ? | La saisie du formulaire est une chaîne ; l’API et `RegisterData` attendent un nombre |
| Validation de l’âge ? | `Register.submit` exige un entier supérieur ou égal à 1 ; ne pas inventer une limite de 18 ans absente du code |
| `aria-pressed` du cœur ? | Indique si le film est favori ; `aria-label` inclut le titre et l’action ajouter/retirer |
| À quoi servent `?.` et `??` dans la note ? | La note peut manquer ; `movie.vote_average?.toFixed(1) ?? 'N/A'` évite une erreur et affiche une valeur de remplacement |
| Pourquoi une classe `ErrorBoundary` ? | C’est l’exception au reste des composants fonctionnels : elle intercepte les erreurs de rendu de ses descendants. Les erreurs HTTP sont gérées séparément avec `catch` |

## Modifications courantes côté Ionic et React

### Ajouter une page « À propos » dans la navigation existante

Créer `src/pages/About.tsx` :

```tsx
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
export default function About() {
  return <IonPage>
    <IonHeader><IonToolbar><IonTitle>À propos</IonTitle></IonToolbar></IonHeader>
    <IonContent className="ion-padding">Movie Match</IonContent>
  </IonPage>;
}
```

Dans `Tabs.tsx`, importer `About`, ajouter `<Route path="about" element={<About />} />` à l’outlet et un objet `{ path: 'about', label: 'À propos', icon: <circle cx="12" cy="12" r="8" /> }` au tableau `links`. La route `/tabs/about` hérite de la protection du parent `/tabs/*`. Conserver ce routeur et cette navigation ; il n’est pas nécessaire d’introduire `IonTabs`.

### Afficher la note dans un composant Ionic

Dans `MovieGrid.tsx`, importer `IonBadge` depuis `@ionic/react`, puis remplacer ou compléter l’affichage de la note :

```tsx
<IonBadge color="primary">{movie.vote_average?.toFixed(1) ?? 'N/A'}</IonBadge>
```

### Réactualiser les matchs à chaque entrée Ionic

Dans la page `Matches.tsx`, importer `useIonViewWillEnter` depuis `@ionic/react` puis, au niveau supérieur du composant :

```tsx
useIonViewWillEnter(() => setRetry((value) => value + 1));
```

Le compteur relance l’effet existant ; ne pas recopier l’appel HTTP dans plusieurs endroits. À la première entrée, cela peut lancer puis remplacer la requête du montage : vérifier ce cas et l’annulation. C’est un exercice de modification, pas le comportement actuel.

### Trier les résultats par note

Dans le traitement du résultat de `Home`, avant `setMovies` :

```tsx
const sorted = [...movies].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
setMovies(sorted);
```

La copie évite de trier directement le tableau partagé provenant du cache. Choisir si le tri doit concerner populaires, recherche, catalogue ou les trois.

### Ajouter un bouton de remise à zéro de la recherche

Dans le JSX de `Home`, à un endroit visible quand `tab === 'popular'` :

```tsx
<button type="button" onClick={() => setQuery('')}>Effacer la recherche</button>
```

L’effet existant revient aux populaires. Ne pas lancer une deuxième requête manuellement dans ce bouton.

### Ajouter le geste Ionic « tirer pour actualiser »

Dans `Home`, ajouter `useRef` aux imports React, `IonRefresher` et `IonRefresherContent` aux imports Ionic, et importer `clearMovieCache` depuis `../lib/movies`. Déclarer au niveau du composant :

```tsx
const refresher = useRef<HTMLIonRefresherElement>(null);
```

Placer ceci à l’intérieur de `IonContent`, avant le contenu :

```tsx
<IonRefresher ref={refresher} slot="fixed" onIonRefresh={() => {
  clearMovieCache();
  setRetry((value) => value + 1);
}}>
  <IonRefresherContent />
</IonRefresher>
```

Dans le `.finally` de l’effet principal, dans le bloc `if (active)`, après `setLoading(false)`, ajouter `void refresher.current?.complete()`. La relance réutilise la logique existante, vide le cache MovieDB et termine l’animation après la requête, même en cas d’erreur. Ne pas appeler `complete()` immédiatement après `setRetry` : les données ne seraient pas encore chargées. Voir [IonRefresher](https://ionicframework.com/docs/api/refresher).

### Remplacer `window.confirm` par une alerte Ionic

Dans `Admin`, importer `useIonAlert`, puis appeler `const [presentAlert] = useIonAlert()` au niveau supérieur. Le bouton peut ouvrir l’alerte suivante :

```tsx
void presentAlert({
  header: 'Confirmer',
  message: `Modifier le compte de ${user.firstName} ?`,
  buttons: [
    { text: 'Annuler', role: 'cancel' },
    { text: 'Confirmer', handler: () => { void toggleActive(user); } }
  ]
});
```

Retirer alors l’ancien `window.confirm` de la condition dans `toggleActive`, sinon deux confirmations s’afficheraient. Conserver le contrôle des opérations en attente et l’appel PATCH existant. Ce hook Ionic est une possibilité d’exercice ; l’application actuelle utilise la confirmation du navigateur.

## Les réponses à éviter

« `useEffect([])` s’exécute à chaque visite », « une ref met automatiquement l’écran à jour », « Ionic remplace React », « notre barre de navigation utilise `IonTabs` », « changer le localStorage suffit pour actualiser React », « tous les composants sont fonctionnels » et « TypeScript valide les réponses réseau à l’exécution » sont faux pour expliquer notre code.

Les règles générales sur les pages viennent de la [navigation Ionic React](https://ionicframework.com/docs/react/navigation) ; les exemples et noms d’état ci-dessus viennent des fichiers du projet.
