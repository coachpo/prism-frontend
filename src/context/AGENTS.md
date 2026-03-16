# FRONTEND CONTEXT KNOWLEDGE BASE

## OVERVIEW
`src/context/` owns the global state bootstrap and reactive boundaries for operator auth and profile scoping.

## DOMAINS
- `AuthContext.tsx`: Operator auth lifecycle. Supports public (login/recovery) and full (protected shell) bootstrap modes. Owns proactive 12-minute session refresh and visibility-triggered refresh.
- `ProfileContext.tsx`: Management scoping. Owns `selectedProfile` (UI focus) vs `activeProfile` (runtime snapshot), localStorage persistence, and `revision` bumps for cache busting.

## WHERE TO LOOK
- Auth bootstrap and refresh logic: `AuthContext.tsx`, `useAuth.ts`
- Profile selection and revision triggers: `ProfileContext.tsx`
- API header synchronization: `ProfileContext.tsx` calls `setApiProfileId()` in `src/lib/api/core.ts`

## CONVENTIONS
- Use `useAuth()` and `useProfileContext()` hooks instead of consuming contexts directly.
- `ProfileContext.revision` is the primary signal for pages to refresh data when the selected profile changes.
- Keep bootstrap logic async and reuse in-flight bootstrap work instead of duplicating auth/profile fetches.

## ANTI-PATTERNS
- Do not invent local profile state in pages.
- Do not assume `selectedProfile` affects proxy traffic; it only scopes management API calls.
