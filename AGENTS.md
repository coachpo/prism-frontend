# FRONTEND KNOWLEDGE BASE

## OVERVIEW
`frontend/` is Prism's management dashboard. This parent doc covers the mounted route surface, the app shell boundary, selected-profile scoping, the typed API entrypoint, and the shared realtime path. Push page-level behavior into `src/pages/AGENTS.md` and feature-local docs instead of duplicating it here.

## STRUCTURE
```
frontend/
└── src/
    ├── App.tsx                                     # BrowserRouter, auth/public split, protected shell mounts
    ├── components/AGENTS.md                        # App layout, shared widgets, navigation config, ui wrappers
    ├── context/AGENTS.md                           # Auth bootstrap, selected-profile state, revision flow
    ├── hooks/AGENTS.md                             # Realtime hook, polling helpers, timezone formatting
    ├── lib/AGENTS.md                               # Typed API boundary, websocket client, WebAuthn, shared types
    └── pages/AGENTS.md                             # Route-domain map and page child-doc delegation
```

## ROUTE MAP

- Public auth routes: `/login`, `/forgot-password`, `/reset-password`
- Protected shell routes: `/dashboard`, `/models`, `/models/:id`, `/endpoints`, `/loadbalance-strategies`, `/statistics`, `/settings`, `/proxy-api-keys`, `/pricing-templates`, `/request-logs`
- `/` redirects to `/dashboard`

## HIERARCHY

- `src/pages/AGENTS.md` is the parent for all mounted page domains and the first stop for route-level work.
- Page leaf docs currently live at `src/pages/dashboard/AGENTS.md`, `src/pages/endpoints/AGENTS.md`, `src/pages/loadbalance-strategies/AGENTS.md`, `src/pages/model-detail/AGENTS.md`, `src/pages/models/AGENTS.md`, `src/pages/pricing-templates/AGENTS.md`, `src/pages/proxy-api-keys/AGENTS.md`, `src/pages/request-logs/AGENTS.md`, `src/pages/settings/AGENTS.md`, and `src/pages/statistics/AGENTS.md`.
- Local page clusters stay parent-covered when they support a single route domain, including `dashboard/routing-diagram/`, `model-detail/connections-list/`, `statistics/operations/`, `statistics/spending/`, and `request-logs/detail` behavior inside the request-logs parent coverage.
- Settings has one more layer: `src/pages/settings/AGENTS.md` delegates section-level details to `src/pages/settings/sections/AGENTS.md` and costing-specific flows to `src/pages/settings/costing/AGENTS.md`.

## WHERE TO LOOK

- Route mounts, `AuthProvider` bootstrap mode split, and `ProtectedAppShell`: `src/App.tsx`
- Sidebar entries, app layout behavior, profile-prefixed navigation helpers, and visible version label: `src/components/layout/AppLayout.tsx`, `src/components/layout/app-layout/navigationProfileConfig.ts`
- Selected-profile state, revision bumps, and `X-Profile-Id` management-route scoping: `src/context/ProfileContext.tsx`, `src/context/AGENTS.md`, `src/lib/api/core.ts`
- Shared typed frontend-to-backend boundary: `src/lib/api.ts`, `src/lib/AGENTS.md`
- Shared realtime websocket path and route consumers: `src/lib/websocket.ts`, `src/hooks/useRealtimeData.ts`, `src/hooks/AGENTS.md`, `src/pages/dashboard/AGENTS.md`
- Page hierarchy and route-domain handoff: `src/pages/AGENTS.md`

## CONVENTIONS

- Treat `src/App.tsx` as the source of truth for mounted routes and auth-shell boundaries.
- Keep Prism backend access on the typed `src/lib/api.ts` boundary and the modules it re-exports.
- Keep selected profile, active profile, and profile revision behavior in `ProfileContext`. Page docs can rely on that contract, but they should not redefine it.
- Keep navigation facts at the shell level. Use page docs for route-domain behavior and leaf docs for dense local clusters.
- Mention realtime at this level only where it changes route behavior, mainly dashboard refresh and shared websocket ownership.

## ANTI-PATTERNS

- Do not add generic React, Vite, or test-runner boilerplate to this parent doc.
- Do not invent shell entries, auth routes, or protected routes beyond the list in `src/App.tsx`.
- Do not blur selected-profile management scope with active runtime routing.
- Do not document page-local request-log detail, model-detail connection-list, or settings section behavior here when the page parents already own those boundaries.
