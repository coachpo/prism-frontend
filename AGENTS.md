# FRONTEND KNOWLEDGE BASE

## OVERVIEW
`frontend/` is Prism's management dashboard. It owns the browser-side management contract for dual-family loadbalance strategy selection (`legacy` and `adaptive`) while keeping this doc as the router for the frontend submodule, not a deep implementation guide.

## STRUCTURE
```text
frontend/
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── components/AGENTS.md
    ├── components/layout/app-layout/AGENTS.md
    ├── components/loadbalance/AGENTS.md
    ├── components/statistics/AGENTS.md
    ├── context/AGENTS.md
    ├── context/auth/AGENTS.md
    ├── context/profile/AGENTS.md
    ├── hooks/AGENTS.md
    ├── i18n/AGENTS.md
    ├── lib/AGENTS.md
    ├── lib/api/AGENTS.md
    ├── lib/websocket/AGENTS.md
    └── pages/AGENTS.md
```

## ROUTE MAP
- Public auth routes: `/login`, `/forgot-password`, `/reset-password`
- Protected shell routes: `/dashboard`, `/models`, `/models/:id`, `/models/:id/proxy`, `/endpoints`, `/loadbalance-strategies`, `/statistics`, `/monitoring`, `/settings`, `/proxy-api-keys`, `/pricing-templates`, `/request-logs`
- `/` redirects to `/dashboard`
- Monitoring vendor/model drill-down page components stay page-owned under `src/pages/` but are not top-level mounted routes in `src/App.tsx`

## HIERARCHY
- `src/App.tsx` owns the mounted route surface.
- `src/pages/AGENTS.md` owns route-domain handoff plus page-owned monitoring drill-down surfaces that are not mounted at the app root.
- `src/components/AGENTS.md` owns shared shell and widget work.
- `src/components/loadbalance/AGENTS.md` and `src/components/statistics/AGENTS.md` own the shared cross-route renderers in those folders.
- `src/lib/websocket/AGENTS.md` owns the helper split beneath the singleton realtime client.

## WHERE TO LOOK
- Mounted routes, auth/public split, and protected shell mounts: `src/App.tsx`
- Page-owned but unmounted monitoring drill-down surfaces: `src/pages/AGENTS.md`, `src/pages/monitoring/AGENTS.md`
- Shell chrome, sidebar entries, profile-prefixed navigation, visible version label, and profile-switcher dialog state: `src/components/AGENTS.md`, `src/components/layout/app-layout/AGENTS.md`
- Selected-profile state, revision bumps, auth bootstrap, and `X-Profile-Id` management scoping: `src/context/AGENTS.md`, `src/context/auth/AGENTS.md`, `src/context/profile/AGENTS.md`
- Typed API boundary and shared request plumbing: `src/lib/AGENTS.md`, `src/lib/api/AGENTS.md`, `src/lib/api.ts`
- Realtime websocket ownership and consumers: `src/lib/websocket.ts`, `src/lib/websocket/AGENTS.md`, `src/hooks/useRealtimeData.ts`
- Shared vendor cache and profile-revision keyed reference-data invalidation: `src/lib/referenceData.ts`
- Frontend locale state and shared formatting: `src/i18n/LocaleProvider.tsx`, `src/i18n/format.ts`
- Page hierarchy and route-domain handoff: `src/pages/AGENTS.md`

## CONVENTIONS
- Treat `src/App.tsx` as the source of truth for routes and shell boundaries.
- Keep unmounted page-owned drill-down components out of the top-level route map even when they live beside mounted pages under `src/pages/`.
- Keep selected profile separate from active runtime routing. `selectedProfile` scopes management APIs; it does not switch proxy traffic.
- Keep backend access on the typed `src/lib/api.ts` boundary and the modules it re-exports.
- Keep realtime ownership in `src/lib/websocket.ts` and consume it through hooks instead of creating ad hoc clients.
- Keep the websocket helper split documented in `src/lib/websocket/AGENTS.md` instead of repeating transport or subscription detail here.
- Keep locale state and shared formatting in `src/i18n/`, not in shell or page code.
- When doing upgrade work, backward compatibility with the pre-upgrade implementation is not a goal unless explicitly requested. Prefer the best current implementation shape over preserving the old one. Do not add compatibility shims, dual paths, or fallback behavior solely to preserve the old interface.

## ANTI-PATTERNS
- Do not add generic React, Vite, or test-runner boilerplate here.
- Do not invent routes, shell entries, or page hierarchies beyond `src/App.tsx` and `src/pages/AGENTS.md`.
- Do not blur selected-profile management scope with active runtime routing.
- Do not duplicate websocket, reference-data, or navigation-config ownership in page docs.
