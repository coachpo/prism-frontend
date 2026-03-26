# FRONTEND CONTEXT KNOWLEDGE BASE

## OVERVIEW
`src/context/` owns Prism's global auth bootstrap and management-profile scoping. Keep the selected-profile versus active-runtime split explicit here, because this is the layer that feeds `X-Profile-Id` for management calls without touching proxy routing.

## STRUCTURE
```
context/
├── AuthContext.tsx    # Provider wiring over auth bootstrap, mutations, and refresh helpers
├── auth-context.ts    # Shared context type and createContext() export
├── useAuth.ts         # Guard hook for auth consumers
├── auth/              # Bootstrap, mutation, and passive/proactive refresh helpers
├── ProfileContext.tsx # Provider wiring over profile bootstrap, actions, persistence, and selection
└── profile/           # Bootstrap, actions, persistence, and selection helpers
```

## WHERE TO LOOK

- Auth bootstrap mode selection, in-flight reuse, proactive refresh timer, and visibility-triggered refresh: `AuthContext.tsx`
- Auth bootstrap, mutation, and refresh helpers: `auth/bootstrap.ts`, `auth/mutations.ts`, `auth/refresh.ts`
- Auth context type/export split and guarded hook: `auth-context.ts`, `useAuth.ts`
- Selected-profile persistence, active-profile sync, `setApiProfileId()` updates, and revision triggers: `ProfileContext.tsx`
- Profile bootstrap, CRUD actions, local-storage persistence, and selected-profile resolution: `profile/bootstrap.ts`, `profile/actions.ts`, `profile/persistence.ts`, `profile/selection.ts`

## CONVENTIONS

- Use `useAuth()` and `useProfileContext()` instead of consuming contexts directly.
- Keep auth bootstrap async and reuse in-flight work instead of duplicating fetches.
- Keep `selectedProfile` and `activeProfile` distinct in UI and docs. `selectedProfile` scopes management APIs, it does not switch proxy traffic.
- Treat `ProfileContext.revision` as the shared invalidation signal when selected scope changes.
- Keep bootstrap and helper logic in `auth/` and `profile/`, with the provider files focused on composition and exposed state.

## ANTI-PATTERNS

- Do not invent local profile state in pages.
- Do not inject `X-Profile-Id` from pages or hooks.
- Do not assume `selectedProfile` affects proxy traffic.
- Do not bypass the `auth/` or `profile/` helper modules with duplicate bootstrap, persistence, or selection logic.
