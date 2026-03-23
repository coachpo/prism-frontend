# FRONTEND LIB KNOWLEDGE BASE

## OVERVIEW
`src/lib/` is the frontend boundary to backend contracts and browser integrations: split API modules, profile-header injection, auth refresh, websocket subscription state, WebAuthn helpers, shared types, and formatting/validation utilities.

## STRUCTURE
```
lib/
├── api.ts                 # Public API facade re-exporting split modules
├── api/
│   ├── core.ts           # API base, X-Profile-Id injection, auth refresh, ApiError, query builder
│   ├── authSettings.ts   # Auth/public-bootstrap, proxy keys, WebAuthn methods
│   ├── management.ts     # Profiles, providers, models, endpoints, connections, pricing templates
│   └── observability.ts  # Stats, spending, metrics, timezone, config, audit, loadbalance
├── websocket.ts          # Singleton WebSocketClient with channel ref-counts and reconnects
├── webauthn.ts           # Browser passkey ceremony helpers over api.settings.auth.webauthn
├── types.ts + types/     # Backend-aligned payload and domain types
├── configImportValidation.ts
├── costing.ts
├── referenceData.ts      # Shared reference-data cache keyed by profile revision
├── timezone.ts
├── clipboard.ts
└── utils.ts
```

## WHERE TO LOOK

- Public import boundary: `api.ts`
- API base URL, `X-Profile-Id` injection, auth refresh retry, query building: `api/core.ts`
- Operator auth, public-bootstrap, proxy keys, passkeys: `api/authSettings.ts`
- Management CRUD clients: `api/management.ts`
- Stats, spending, metrics, timezone, config, audit, loadbalance: `api/observability.ts`
- Shared reference-data cache and request dedupe for models, providers, endpoints, connection options, and pricing templates, all keyed by profile revision: `referenceData.ts`
- WebSocket connection state, reconnects, channel ref-counts, and profile switching: `websocket.ts`
- Browser passkey helpers and support checks: `webauthn.ts`
- Backend-aligned payload types: `types.ts`, `types/`

## CONVENTIONS

- Pages and hooks should import from `api.ts` or the exported helpers, not call `fetch()` directly.
- `setApiProfileId()` is fed by `ProfileContext`; `api/core.ts` is the only place that injects `X-Profile-Id` into `/api/*` requests.
- `request()` handles cookie credentials, `ApiError`, and one refresh retry for eligible `/api/*` paths; keep additional retry logic out of callers.
- `referenceData.ts` owns shared cache reuse, request dedupe, and revision-keyed invalidation for the shared lookup datasets it already exports. Extend it before adding another cache.
- `websocket.ts` owns the singleton client, channel ref-counts, reconnect behavior, and profile switches. Consumers should use `useRealtimeData()` instead of creating clients directly.
- Keep browser WebAuthn ceremony code in `webauthn.ts`; API modules should stay transport-focused.
- Keep backend payload naming aligned with server schemas; the type layer intentionally stays snake_case.

## ANTI-PATTERNS

- Do not bypass `api/core.ts` for Prism backend requests or inject `X-Profile-Id` from pages.
- Do not create ad hoc websocket clients or duplicate subscribe/unsubscribe bookkeeping outside `websocket.ts`.
- Do not add a parallel reference-data cache for models, providers, endpoints, connections, or pricing templates when `referenceData.ts` already owns those datasets.
- Do not move passkey browser ceremony into page components when `webauthn.ts` already owns it.
- Do not camelCase backend response fields in the shared type layer; mirror the API contract directly.
