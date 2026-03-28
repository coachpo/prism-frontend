# FRONTEND KNOWLEDGE BASE

## OVERVIEW
`frontend/` is Prism's management dashboard. Keep this doc as the router for the frontend submodule, not a deep implementation guide. The important shared boundaries are the app shell, `src/main.tsx` provider mount, selected-profile management scope, typed API entrypoint, realtime channel ownership, and locale formatting.

## STRUCTURE
```
frontend/
└── src/
    ├── App.tsx                              # Mounted routes, auth/public split, protected shell
    ├── main.tsx                             # Browser mount and top-level provider wiring
    ├── components/AGENTS.md                 # Shared shell chrome and reusable widgets
    ├── components/layout/app-layout/AGENTS.md # Sidebar, header, profile switcher, version label cluster
    ├── context/AGENTS.md                    # Auth bootstrap, selected-profile state, revision flow
    ├── context/auth/AGENTS.md               # Auth bootstrap loader, mutations, proactive refresh helpers
    ├── context/profile/AGENTS.md            # Profile bootstrap, persistence, selection, CRUD helpers
    ├── hooks/AGENTS.md                      # Realtime hook, polling, timezone helpers
    ├── i18n/AGENTS.md                       # Frontend-only locale state, catalogs, formatting
    ├── lib/AGENTS.md                        # API core, websocket client, reference data, WebAuthn
    ├── lib/api/AGENTS.md                    # Typed `/api/*` client modules and grouped API surfaces
    └── pages/AGENTS.md                      # Route-domain map and page handoff
```

## ROUTE MAP

- Public auth routes: `/login`, `/forgot-password`, `/reset-password`
- Protected shell routes: `/dashboard`, `/models`, `/models/:id`, `/models/:id/proxy`, `/endpoints`, `/loadbalance-strategies`, `/statistics`, `/settings`, `/proxy-api-keys`, `/pricing-templates`, `/request-logs`
- `/` redirects to `/dashboard`

## HIERARCHY

- `src/main.tsx` owns browser mounting and top-level provider composition.
- `src/App.tsx` owns the mounted route surface and auth-shell split.
- `src/pages/AGENTS.md` owns route-domain handoff for mounted pages and their local leaf docs.
- `src/components/AGENTS.md` routes shared shell and widget work, while `src/components/layout/app-layout/AGENTS.md` owns the dense shell-state cluster.
- `src/context/AGENTS.md` routes provider-level state; `src/context/auth/AGENTS.md` and `src/context/profile/AGENTS.md` own the helper subtrees behind those providers.
- `src/lib/AGENTS.md` owns transport and shared browser integrations; `src/lib/api/AGENTS.md` owns the typed `/api/*` client split.
- `src/hooks/AGENTS.md` and `src/i18n/AGENTS.md` continue to own shared hook and locale boundaries.

## WHERE TO LOOK

- Mounted routes, auth/public split, protected shell mounts: `src/App.tsx`
- Shell chrome, sidebar entries, profile-prefixed navigation, visible version label, and profile-switcher dialog state: `src/components/AGENTS.md`, `src/components/layout/app-layout/AGENTS.md`
- Selected-profile state, revision bumps, auth bootstrap, and `X-Profile-Id` management scoping: `src/context/AGENTS.md`, `src/context/auth/AGENTS.md`, `src/context/profile/AGENTS.md`
- Typed API boundary and shared request plumbing: `src/lib/AGENTS.md`, `src/lib/api/AGENTS.md`, `src/lib/api.ts`
- Realtime websocket ownership and consumers: `src/lib/websocket.ts`, `src/hooks/useRealtimeData.ts`
- Shared vendor cache and profile-revision keyed reference-data invalidation: `src/lib/referenceData.ts`
- Frontend locale state and shared formatting: `src/i18n/LocaleProvider.tsx`, `src/i18n/format.ts`
- Page hierarchy and route-domain handoff: `src/pages/AGENTS.md`

## CONVENTIONS

- Treat `src/App.tsx` as the source of truth for routes and shell boundaries.
- Keep selected profile separate from active runtime routing. `selectedProfile` scopes management APIs, it does not switch proxy traffic.
- Keep backend access on the typed `src/lib/api.ts` boundary and the modules it re-exports.
- Keep realtime ownership in `src/lib/websocket.ts` and consume it through hooks instead of creating ad hoc clients.
- Keep locale state and shared formatting in `src/i18n/`, not in shell or page code.

## ANTI-PATTERNS

- Do not add generic React, Vite, or test-runner boilerplate here.
- Do not invent routes, shell entries, or page hierarchies beyond `src/App.tsx` and `src/pages/AGENTS.md`.
- Do not blur selected-profile management scope with active runtime routing.
- Do not duplicate websocket, reference-data, or navigation-config ownership in page docs.
