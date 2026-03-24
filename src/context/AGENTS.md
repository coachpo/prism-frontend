# FRONTEND CONTEXT KNOWLEDGE BASE

## OVERVIEW
`src/context/` owns the global state bootstrap and reactive boundaries for operator auth and profile scoping.

## DOMAINS
- `AuthContext.tsx`: Operator auth lifecycle. Supports `public` and `full` bootstrap modes, keeps in-flight bootstrap promises per mode, runs proactive 12-minute session refresh, and refreshes again when the tab becomes visible.
- `auth-context.ts`: Shared `AuthContext` type and `createContext()` export that `AuthContext.tsx` provides and `useAuth.ts` consumes.
- `useAuth.ts`: Thin guard hook for reading `AuthContext` safely from shell and page helpers.
- `ProfileContext.tsx`: Management scoping. Bootstraps profiles and the active profile in parallel, persists `selectedProfile`, feeds `setApiProfileId()` so `/api/*` requests carry `X-Profile-Id`, and bumps `revision` when the effective management scope meaningfully changes.

## WHERE TO LOOK
- Auth bootstrap, provider wiring, and refresh logic: `AuthContext.tsx`
- Auth context type/export split and guarded hook: `auth-context.ts`, `useAuth.ts`
- Profile selection, persistence, and revision triggers: `ProfileContext.tsx`
- API header synchronization: `ProfileContext.tsx` calls `setApiProfileId()` in `src/lib/api/core.ts`

## CONVENTIONS
- Use `useAuth()` and `useProfileContext()` hooks instead of consuming contexts directly. `auth-context.ts` is the shared low-level boundary, not a second place for auth logic.
- `ProfileContext.revision` is the shared signal for cache invalidation and data refresh when selected scope changes.
- Keep bootstrap logic async and reuse in-flight bootstrap work instead of duplicating auth or profile fetches.
- Keep the `selectedProfile` and `activeProfile` split explicit in UI and docs. The selected profile scopes management APIs, not proxy runtime traffic.

## ANTI-PATTERNS
- Do not invent local profile state in pages.
- Do not inject `X-Profile-Id` from pages or hooks. That boundary stays in `ProfileContext` plus `src/lib/api/core.ts`.
- Do not assume `selectedProfile` affects proxy traffic; it only scopes management API calls.
