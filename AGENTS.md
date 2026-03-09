# FRONTEND KNOWLEDGE BASE

## OVERVIEW
React 19 + TypeScript dashboard for Prism management workflows. Built with Vite 7, Tailwind CSS 4, shadcn/ui, and React Router, with profile-aware API scoping plus cookie-backed operator auth wired through shared contexts and a central typed client.

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
└── pages/AGENTS.md                 # Page-domain conventions and helper patterns
```

## CURRENT ROUTES

- Public auth routes: `/login`, `/forgot-password`, `/reset-password`
- Protected shell routes: `/dashboard`, `/models`, `/models/:id`, `/endpoints`, `/statistics`, `/request-logs`, `/proxy-api-keys`, `/settings`, `/pricing-templates`
- `/` still redirects to `/dashboard`

## CHILD DOC

- `src/pages/AGENTS.md`: use for page-specific conventions, filter/query param patterns, settings-section architecture, and model-detail state extraction.

## WHERE TO LOOK

- Profile scope behavior: `src/context/ProfileContext.tsx`, `src/lib/api.ts`
- App shell + profile UX: `src/components/layout/AppLayout.tsx`, `src/components/layout/app-layout/navigationProfileConfig.ts`
- Operator auth bootstrap and redirects: `src/context/AuthContext.tsx`, `src/context/useAuth.ts`, `src/App.tsx`
- Type and payload alignment: `src/lib/types.ts`, `src/lib/configImportValidation.ts`
- Cost/time formatting: `src/lib/costing.ts`, `src/lib/timezone.ts`, `src/hooks/useTimezone.ts`
- Connection owner navigation: `src/hooks/useConnectionNavigation.ts`
- Page-specific workflows: `src/pages/AGENTS.md`

## CONVENTIONS

- Prefer `@/` imports for `src` modules.
- All Prism backend calls should go through `src/lib/api.ts`; that is where `X-Profile-Id` injection for `/api/*` lives.
- `src/lib/api.ts` also owns cookie-based auth refresh for `/api/*`; do not duplicate retry logic in pages.
- `ProfileContext` owns selected-profile and active-profile state; reuse it instead of inventing local profile state.
- `selected profile` and `active profile` are intentionally different concepts in UI copy and behavior.
- `packageManager` is pinned to `pnpm@10.30.1`.

## ANTI-PATTERNS

- Do not bypass `src/lib/api.ts` for Prism backend requests.
- Do not assume selected profile equals active runtime profile.
- Do not mount auth-sensitive UI outside `AuthProvider` / `useAuth()`.
- Do not remove destructive-action confirmations in settings/config flows.
- Do not add unsupported provider types or render raw micros when formatting helpers exist.

## NOTES

- The old audit page references are stale: the current app still has audit API methods in `src/lib/api.ts`, but `src/App.tsx` does not mount a `/audit` route.
- `navigationProfileConfig.ts` is the current source of truth for sidebar entries, profile-scoped route prefixes, and the frontend version label.
