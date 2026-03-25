# FRONTEND CONTEXT KNOWLEDGE BASE

## OVERVIEW
`src/context/` owns Prism's global auth bootstrap and management-profile scoping. Keep the selected-profile versus active-runtime split explicit here, because this is the layer that feeds `X-Profile-Id` for management calls without touching proxy routing.

## DOMAINS
- `AuthContext.tsx`: Operator auth lifecycle, `public` and `full` bootstrap modes, in-flight promise reuse, proactive session refresh, and visibility-triggered refresh.
- `auth-context.ts`: Shared context type and `createContext()` export.
- `useAuth.ts`: Guard hook for reading auth state from shell and page helpers.
- `ProfileContext.tsx`: Management scoping, profile bootstrapping, `selectedProfile` persistence, `setApiProfileId()` updates, and `revision` bumps when scope changes.

## WHERE TO LOOK
- Auth bootstrap, provider wiring, refresh logic: `AuthContext.tsx`
- Auth context type/export split and guarded hook: `auth-context.ts`, `useAuth.ts`
- Selected-profile persistence, active-profile sync, and revision triggers: `ProfileContext.tsx`
- API header synchronization into `src/lib/api/core.ts`: `ProfileContext.tsx`

## CONVENTIONS
- Use `useAuth()` and `useProfileContext()` instead of consuming contexts directly.
- Keep auth bootstrap async and reuse in-flight work instead of duplicating fetches.
- Keep `selectedProfile` and `activeProfile` distinct in UI and docs. `selectedProfile` scopes management APIs, it does not switch proxy traffic.
- Treat `ProfileContext.revision` as the shared invalidation signal when selected scope changes.

## ANTI-PATTERNS
- Do not invent local profile state in pages.
- Do not inject `X-Profile-Id` from pages or hooks.
- Do not assume `selectedProfile` affects proxy traffic.
