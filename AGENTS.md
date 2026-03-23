# FRONTEND KNOWLEDGE BASE

## OVERVIEW
React 19 plus TypeScript dashboard for Prism management workflows. It uses Vite, Tailwind CSS 4, shadcn/ui, and React Router 7, with profile-aware API scoping, cookie-backed operator auth, shared realtime plumbing, and a typed API client boundary.

## STRUCTURE
```
frontend/
└── src/
    ├── App.tsx                                     # BrowserRouter, auth shell split, route mounts
    ├── components/AGENTS.md                        # Shared shell, widgets, navigation, ui
    ├── context/AGENTS.md                           # Auth bootstrap and profile scoping
    ├── hooks/AGENTS.md                             # Realtime, polling, timezone hooks
    ├── lib/AGENTS.md                               # API, websocket, WebAuthn, types
    └── pages/AGENTS.md                             # Route layer and child feature docs
```

## ROUTE MAP

- Public auth routes: `/login`, `/forgot-password`, `/reset-password`
- Protected shell routes: `/dashboard`, `/models`, `/models/:id`, `/endpoints`, `/statistics`, `/settings`, `/proxy-api-keys`, `/pricing-templates`, `/request-logs`
- `/` redirects to `/dashboard`

## CHILD DOCS

- `src/context/AGENTS.md`: auth bootstrap modes, refresh flow, and profile-scoping boundaries.
- `src/hooks/AGENTS.md`: shared realtime, polling, and timezone logic.
- `src/components/AGENTS.md`: app shell, nav config, loadbalance widgets, statistics widgets, and shared UI wrappers.
- `src/lib/AGENTS.md`: split API modules, websocket client, WebAuthn helpers, and type ownership.
- `src/pages/AGENTS.md`: route-level guide for page flows and page child docs.
- `src/pages/settings/sections/AGENTS.md`: settings section ownership, auth flows, provider audit controls, retention, and related form boundaries.
- `src/pages/settings/costing/AGENTS.md`: costing-specific settings flows and helper ownership.

## WHERE TO LOOK

- Route mounts and auth shell split: `src/App.tsx`
- Profile scope and `X-Profile-Id` injection: `src/context/ProfileContext.tsx`, `src/lib/api/core.ts`
- App shell, sidebar entries, profile-scoped prefixes, and version label: `src/components/layout/AppLayout.tsx`, `src/components/layout/app-layout/navigationProfileConfig.ts`
- Shared typed API boundary: `src/lib/api.ts`, `src/lib/AGENTS.md`
- Realtime client and hook boundary: `src/lib/websocket.ts`, `src/hooks/useRealtimeData.ts`, `src/hooks/AGENTS.md`
- Settings doc hierarchy: `src/pages/AGENTS.md`, `src/pages/settings/sections/AGENTS.md`, `src/pages/settings/costing/AGENTS.md`

## CONVENTIONS

- Prefer `@/` imports for `src` modules.
- Route Prism backend calls through `src/lib/api.ts` and the split modules it re-exports.
- Let `ProfileContext` own selected-profile and active-profile state.
- Keep auth-sensitive UI inside `AuthProvider` and `useAuth()`.
- Treat `navigationProfileConfig.ts` as the source of truth for sidebar entries, profile-scoped route prefixes, and the frontend version label.
- Use child docs when you need page-level or feature-level details.

## ANTI-PATTERNS

- Do not bypass `src/lib/api.ts` for Prism backend requests.
- Do not assume selected profile equals active runtime profile.
- Do not open ad hoc websocket connections from pages.
- Do not invent unsupported provider types, routes, or shell entries.

## NOTES

- `src/App.tsx` currently mounts 3 public auth routes and 9 protected shell routes.
- Loadbalance events no longer have their own top-level route. They live in `src/pages/ModelDetailPage.tsx`.
- Frontend build metadata comes from `VITE_GIT_RUN_NUMBER` and `VITE_GIT_REVISION`, and the visible version label is assembled in `src/components/layout/app-layout/navigationProfileConfig.ts`.
