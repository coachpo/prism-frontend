# FRONTEND KNOWLEDGE BASE

## OVERVIEW
`frontend/` is Prism's management dashboard. Keep this doc as the router for the frontend submodule, not a deep implementation guide. The important shared boundaries are the app shell, selected-profile management scope, typed API entrypoint, realtime channel ownership, and locale formatting.

## STRUCTURE
```
frontend/
└── src/
    ├── App.tsx              # Mounted routes, auth/public split, protected shell
    ├── components/AGENTS.md # Shell chrome, shared widgets, navigation config
    ├── context/AGENTS.md    # Auth bootstrap, selected-profile state, revision flow
    ├── hooks/AGENTS.md      # Realtime hook, polling, timezone helpers
    ├── i18n/AGENTS.md       # Frontend-only locale state, catalogs, formatting
    ├── lib/AGENTS.md        # API core, websocket client, reference data, WebAuthn
    └── pages/AGENTS.md      # Route-domain map and page handoff
```

## ROUTE MAP

- Public auth routes: `/login`, `/forgot-password`, `/reset-password`
- Protected shell routes: `/dashboard`, `/models`, `/models/:id`, `/endpoints`, `/loadbalance-strategies`, `/statistics`, `/settings`, `/proxy-api-keys`, `/pricing-templates`, `/request-logs`
- `/` redirects to `/dashboard`

## HIERARCHY

- `src/App.tsx` owns the mounted route surface and auth-shell split.
- `src/pages/AGENTS.md` owns route-domain handoff for mounted pages and their local leaf docs.
- `src/components/AGENTS.md`, `src/context/AGENTS.md`, `src/hooks/AGENTS.md`, `src/i18n/AGENTS.md`, and `src/lib/AGENTS.md` own shared shell, state, realtime, locale, and transport boundaries.

## WHERE TO LOOK

- Mounted routes, auth/public split, protected shell mounts: `src/App.tsx`
- Shell chrome, sidebar entries, profile-prefixed navigation, visible version label: `src/components/layout/AppLayout.tsx`, `src/components/layout/app-layout/navigationProfileConfig.ts`
- Selected-profile state, revision bumps, and `X-Profile-Id` management scoping: `src/context/ProfileContext.tsx`, `src/lib/api/core.ts`
- Typed API boundary and shared request plumbing: `src/lib/api.ts`, `src/lib/api/core.ts` (including ordered `proxy_targets`, resolved-target request-log context, and config import validation mirrored from the backend contract)
- Realtime websocket ownership and consumers: `src/lib/websocket.ts`, `src/hooks/useRealtimeData.ts`
- Shared reference data and profile-revision keyed cache invalidation: `src/lib/referenceData.ts`
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
