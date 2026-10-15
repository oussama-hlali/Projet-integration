# Smart Campus — Web Frontend (Angular)

Sprint 1 foundation for the **Smart Campus 2026** single-page application.

This app is the web client only. It ships **mock data only** — no backend, no
PHP, no AI features. REST integration with the Spring Boot / Node microservices
comes in a later sprint (see the section at the end).

## Tech stack

- Angular **20** — standalone components, signals, strict TypeScript
- SCSS with a CSS-custom-property design system
- Angular Router with lazy `loadComponent`
- No `any`, no NgModules, mock data only

## Prerequisites

- Node.js 20+ (developed on 22.x)
- npm 10+
- Angular CLI 20 (`npm i -g @angular/cli`, optional — scripts work without it)

## Install & run

```bash
cd angular-front
npm install
ng serve        # or: npm start
```

Open `http://localhost:4200/`. The dev server reloads on file changes.

```bash
ng build        # production build in dist/
ng test         # unit tests (Karma)
```

## Folder structure

```
src/
├─ styles/
│  ├─ _tokens.scss      # design tokens (colors, spacing, radii, type, z-index…)
│  ├─ _base.scss        # reset + base typography + focus-visible
│  └─ _utilities.scss   # .container, .page, spacing helpers
├─ styles.scss          # global entry point (imports the three partials)
└─ app/
   ├─ app.ts / app.html / app.scss   # root component: <router-outlet /> only
   ├─ app.config.ts                  # providers (router, error listeners)
   ├─ app.routes.ts                  # ALL routes (lazy loadComponent)
   ├─ core/
   │  ├─ guards/         # auth.guard.ts, admin.guard.ts
   │  ├─ interceptors/   # reserved for HTTP interceptors (teammate)
   │  ├─ models/         # user.model.ts (UserRole, User)
   │  └─ services/       # auth.service.ts (signals)
   ├─ shared/            # components/, pipes/, ui/  (teammate 4)
   ├─ layout/            # app-shell/, sidebar/, topbar/  (teammate 2)
   └─ features/          # one folder per route (placeholders for now)
```

## Git workflow

- `main` — stable, protected. Never commit directly.
- `feature/<name>` — one branch per task, e.g. `feature/foundation`,
  `feature/app-shell`, `feature/models-services`, `feature/shared-ui`.

```bash
git checkout main
git pull
git checkout -b feature/<name>
# ... commit in small, clear steps ...
```

Open a pull request into `main` when the feature builds cleanly.

## Coding rules

- **Standalone components only** — no `NgModule`.
- **Strict TypeScript** — never use `any`; model data with explicit types/interfaces.
- **Signals** for local/state where practical (`computed` for derived state).
- **SCSS** per component; consume design tokens via `var(--token-name)` — never hard-code colors/spacing.
- **Lazy load** feature routes with `loadComponent`.
- **Mock data only** — no backend calls, no AI, no PHP in this sprint.
- Accessible by default: labelled controls, keyboard focus (`:focus-visible`), semantic landmarks.

## Design tokens

All tokens live in `src/styles/_tokens.scss` on `:root`. Key groups:
colors (`--color-bg`, `--color-surface`, `--color-text`, `--color-accent`,
`--color-success|warning|danger|info`), spacing (`--space-1`…`--space-9`),
radii (`--radius-sm|md|lg|xl|full`), shadows (`--shadow-sm|md|lg`),
typography (`--font-size-*`, `--font-weight-*`, `--line-height-*`),
breakpoints (`--bp-sm|md|lg|xl`) and `--z-*`.

## AuthService API (demo)

```ts
const auth = inject(AuthService);

auth.currentRole;      // Signal<'student' | 'administrator' | null>
auth.isAuthenticated;  // Signal<boolean>
auth.isAdmin;          // Signal<boolean>
auth.login('student'); // persists to localStorage
auth.logout();         // clears the demo session
```

> Demo only — there is no real authentication or security boundary.

## Routes

`/login`, `/dashboard`, `/rooms`, `/reservations`, `/events`, `/announcements`,
`/transport`, `/cafeteria`, `/lost-found`, `/notifications`, `/profile`,
`/admin`, `/admin/rooms`, `/admin/events`, `/admin/announcements`, `/admin/users`
plus a `**` not-found route. `''` redirects to `/dashboard`.

Protected routes use `authGuard` (redirects to `/login`) and the `/admin/**`
area additionally uses `adminGuard` (students are sent to `/dashboard`).

## Replacing mock services with Spring Boot REST APIs later

1. Add `provideHttpClient()` to `src/app/app.config.ts`.
2. Add an interceptor in `core/interceptors/` for auth headers, base URL and errors.
3. Define DTO interfaces in `core/models/`.
4. Implement real services in `core/services/` that call the REST endpoints with the
   same method signatures the mock services expose, then swap the provider.
5. Keep components dependent on service interfaces only, so no UI code changes.
