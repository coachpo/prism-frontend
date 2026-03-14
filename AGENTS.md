# FRONTEND KNOWLEDGE BASE

## OVERVIEW
React 19 + TypeScript dashboard for Prism management workflows. Built with Vite 7, Tailwind CSS 4, shadcn/ui, and React Router 7, with profile-aware API scoping plus cookie-backed operator auth wired through shared contexts and a central typed client.

## STRUCTURE
```
src/
├── main.tsx                        # Bootstraps app providers and App
├── App.tsx                         # BrowserRouter + AuthProvider + protected shell + auth/public routes
├── context/ProfileContext.tsx      # Selected vs active profile state, localStorage, API header sync
├── context/AuthContext.tsx         # Operator auth bootstrap, refresh, login/logout state
├── hooks/                          # useConnectionNavigation, useTimezone
├── lib/                            # api.ts, types.ts, costing.ts, timezone.ts, validation helpers
├── components/                     # App shell, shared widgets, shadcn/ui
└── pages/AGENTS.md                 # Route layer + child feature docs
```

## CURRENT ROUTES

- Public auth routes: `/login`, `/forgot-password`, `/reset-password`
- Protected shell routes: `/dashboard`, `/models`, `/models/:id`, `/endpoints`, `/statistics`, `/request-logs`, `/proxy-api-keys`, `/settings`, `/pricing-templates`, `/loadbalance-events`
- `/` still redirects to `/dashboard`

## CHILD DOC

- `src/pages/AGENTS.md`: route-level guide for page flows, helper-folder boundaries, and child docs under `settings/`, `statistics/`, `model-detail/`, and `request-logs/`.

## WHERE TO LOOK

- Profile scope behavior: `src/context/ProfileContext.tsx`, `src/lib/api.ts`
- App shell + profile UX: `src/components/layout/AppLayout.tsx`, `src/components/layout/app-layout/navigationProfileConfig.ts`
- Operator auth bootstrap and redirects: `src/context/AuthContext.tsx`, `src/context/useAuth.ts`, `src/App.tsx`
- Type and payload alignment: `src/lib/types.ts`, `src/lib/configImportValidation.ts`
- Cost and time formatting: `src/lib/costing.ts`, `src/lib/timezone.ts`, `src/hooks/useTimezone.ts`
- Connection owner navigation: `src/hooks/useConnectionNavigation.ts`
- Page-specific workflows: `src/pages/AGENTS.md`

## CONVENTIONS

- Prefer `@/` imports for `src` modules.
- All Prism backend calls should go through `src/lib/api.ts`; it is the public boundary that re-exports the split API modules where `X-Profile-Id` injection and cookie-based auth refresh for `/api/*` live.
- `ProfileContext` owns selected-profile and active-profile state, localStorage persistence, and revision bumps; reuse it instead of inventing local profile state.
- `AuthContext` owns bootstrap, session refresh, proactive 12-minute refresh, and visibility-triggered refresh.
- `selected profile` and `active profile` are intentionally different concepts in UI copy and behavior.
- `packageManager` is pinned to `pnpm@10.30.1`.

## ANTI-PATTERNS

- Do not bypass `src/lib/api.ts` for Prism backend requests.
- Do not assume selected profile equals active runtime profile.
- Do not mount auth-sensitive UI outside `AuthProvider` and `useAuth()`.
- Do not remove destructive-action confirmations in settings and config flows.
- Do not add unsupported provider types or render raw micros when formatting helpers exist.

## NOTES

- The old audit page references are stale: `src/lib/api.ts` still exposes audit methods, but `src/App.tsx` does not mount a `/audit` route and audit detail currently lives in the request-log drawer flow instead of a standalone page.
- `navigationProfileConfig.ts` is the current source of truth for sidebar entries, profile-scoped route prefixes, and the frontend version label.
- Frontend build metadata comes from `VITE_GIT_RUN_NUMBER` and `VITE_GIT_REVISION`, which are injected by `.github/workflows/docker-images.yml`.
