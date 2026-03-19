# FRONTEND KNOWLEDGE BASE

## OVERVIEW
React 19 + TypeScript dashboard for Prism management workflows. Built with Vite 8, Tailwind CSS 4, shadcn/ui, and React Router 7, with profile-aware API scoping, cookie-backed operator auth, shared realtime WebSocket plumbing, and a central typed client boundary.

## STRUCTURE
```
src/
├── main.tsx                        # Bootstraps app providers and App
├── App.tsx                         # BrowserRouter + AuthProvider + protected shell + auth/public routes
├── components/AGENTS.md            # Shared shell, widgets, loadbalance, statistics, and ui boundary
├── context/AGENTS.md               # Auth bootstrap and profile-scoping boundaries
├── hooks/AGENTS.md                 # Realtime, polling, and timezone hooks
├── lib/AGENTS.md                   # api/core/websocket/webauthn/types boundary
├── components/                     # App shell, shared widgets, loadbalance, statistics, shadcn/ui
└── pages/AGENTS.md                 # Route layer + child feature docs
```

## CURRENT ROUTES

- Public auth routes: `/login`, `/forgot-password`, `/reset-password`
- Protected shell routes: `/dashboard`, `/models`, `/models/:id`, `/endpoints`, `/statistics`, `/request-logs`, `/proxy-api-keys`, `/settings`, `/pricing-templates`
- `/` still redirects to `/dashboard`

## CHILD DOCS

- `src/context/AGENTS.md`: auth bootstrap modes, proactive refresh, and profile-scoping boundaries.
- `src/hooks/AGENTS.md`: shared realtime, polling, and timezone logic.
- `src/components/AGENTS.md`: shared shell, layout state, loadbalance widgets, statistics cards, and ui wrappers.
- `src/lib/AGENTS.md`: split API client modules, websocket client, WebAuthn helpers, and type boundaries.
- `src/pages/AGENTS.md`: route-level guide for page flows and child docs under `dashboard/`, `endpoints/`, `model-detail/`, `models/`, `pricing-templates/`, `proxy-api-keys/`, `request-logs/`, `settings/`, and `statistics/`.

## WHERE TO LOOK

- Profile scope behavior: `src/context/ProfileContext.tsx`, `src/lib/api/core.ts`
- App shell + profile UX: `src/components/layout/AppLayout.tsx`, `src/components/layout/app-layout/navigationProfileConfig.ts`
- Shared shell, loadbalance, statistics, and widget boundaries: `src/components/AGENTS.md`
- Operator auth bootstrap and redirects: `src/context/AuthContext.tsx`, `src/context/AGENTS.md`
- Request-log investigation route and helpers: `src/pages/RequestLogsPage.tsx`, `src/pages/request-logs/AGENTS.md`
- Type and payload alignment: `src/lib/types.ts`, `src/lib/types/`, `src/lib/configImportValidation.ts`
- Realtime client and hook boundary: `src/lib/websocket.ts`, `src/hooks/AGENTS.md`
- Passkey browser helpers: `src/lib/webauthn.ts`, `src/pages/settings/sections/authentication/usePasskeyManagement.ts`
- Cost and time formatting: `src/lib/costing.ts`, `src/lib/timezone.ts`, `src/hooks/useTimezone.ts`
- Connection owner navigation: `src/hooks/useConnectionNavigation.ts`
- Frontend test setup: `src/test/setup.ts`
- Page-specific workflows: `src/pages/AGENTS.md`

## CONVENTIONS

- Prefer `@/` imports for `src` modules.
- All Prism backend calls should go through `src/lib/api.ts`; it is the public boundary that re-exports the split API modules where `X-Profile-Id` injection and cookie-based auth refresh for `/api/*` live.
- `ProfileContext` owns selected-profile and active-profile state, localStorage persistence, and revision bumps; reuse it instead of inventing local profile state.
- `AuthContext` owns bootstrap, session refresh, proactive 12-minute refresh, and visibility-triggered refresh.
- Shared realtime flows should use `useRealtimeData()` from `src/hooks/AGENTS.md`.
- `selected profile` and `active profile` are intentionally different concepts in UI copy and behavior.
- `packageManager` is pinned to `pnpm@10.30.1`.
- Frontend tests are co-located `__tests__/` Vitest suites with shared setup in `src/test/setup.ts`.

## ANTI-PATTERNS

- Do not bypass `src/lib/api.ts` for Prism backend requests.
- Do not assume selected profile equals active runtime profile.
- Do not mount auth-sensitive UI outside `AuthProvider` and `useAuth()`.
- Do not open ad hoc `WebSocket` connections from pages; use the shared client and hook layer.
- Do not remove destructive-action confirmations in settings and config flows.
- Do not add unsupported provider types or render raw micros when formatting helpers exist.

## NOTES

- `src/lib/api.ts` exposes the audit methods consumed by the mounted request-log investigation route in `src/pages/RequestLogsPage.tsx`.
- `navigationProfileConfig.ts` is the current source of truth for sidebar entries, profile-scoped route prefixes, and the frontend version label.
- Loadbalance events no longer mount as a standalone route; the model-scoped view lives on `src/pages/ModelDetailPage.tsx`.
- Frontend build metadata comes from `VITE_GIT_RUN_NUMBER` and `VITE_GIT_REVISION`, which are injected by `.github/workflows/docker-images.yml`.
- Shared realtime hook coverage currently lives in `src/hooks/__tests__/useRealtimeData.test.tsx` rather than beside `src/lib/websocket.ts`.
