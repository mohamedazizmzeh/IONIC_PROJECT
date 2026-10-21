# Migration checklist

- [x] React/Vite setup and test runner
- [x] API compatibility, cache, session and favorites
- [x] Login and camera registration
- [x] Grid, favorites, matches, profile and admin
- [x] Browser, build, type, lint and regression checks
- [x] Remove Angular-only files and update documentation
- [x] Verify Ionic styles, Capacitor and backend preservation

Validation: 36 tests pass; strict TypeScript, ESLint, production build and `git diff --check` pass. Ionic CLI recognizes Ionic React 9.0.7. No Angular/RxJS dependencies remain. Static assets moved to `public/assets` without changing their contents. The original theme files, Capacitor config/plugins and backend have no changes.

Browser checks: desktop and 390px mobile layouts, production login/navigation, grid, favorites, matches, profile/admin, search, and camera JPEG capture/stream cleanup. API responses and video input were simulated because the local API is not running and no physical camera was available. Physical Android/iOS testing remains outside these local checks; the original project has no installed native platforms.

Performance preservation: bounded ten-minute caches, shared in-flight movie requests, 300ms search debounce, stale-response protection, optimistic favorites with per-film duplicate suppression and rollback, request timeouts, and four concurrent favorite detail requests. A regression test confirms each freed request slot immediately starts the next favorite.

Known tool notices: React Router 6 prints upgrade notices in development; Vite reports the main Ionic bundle above its default 500kB warning threshold. The build succeeds. No additional state or performance framework was introduced.
