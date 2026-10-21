# Angular to React migration

Replace Angular with simple React components and functions, keeping Ionic 9, Capacitor plugins and configuration, the current screens and styles, URLs, API contracts, local session keys, camera capture, and favorite behavior.

1. Set up Vite, React, Ionic React and tests. Keep the build output at `www`.
2. Port API calls, movie caching and shared session/favorites state using fetch and one React context.
3. Port login and camera registration, then the movie grid, favorites, matches, profile and admin pages.
4. Verify behavior with regression tests and a browser. Remove Angular-only files and dependencies after the React app works.
5. Document startup commands and verify the backend and Capacitor configuration have no changes.

Acceptance: production build, strict TypeScript, lint and tests pass; Ionic UI and camera flows work; routes and permissions are preserved; no Angular dependencies remain. A live backend still requires the existing MongoDB/JWT configuration.
