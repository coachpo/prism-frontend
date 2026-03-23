# FRONTEND PAGES KNOWLEDGE BASE

## OVERVIEW
`src/pages/` is the route-domain layer for the mounted frontend pages. Route files own URL entrypoints, page bootstrap, and page-level navigation state. Dense feature folders keep local orchestration close to each route once the page shell becomes thin.

## ROUTE SURFACE

- Public auth routes: `/login`, `/forgot-password`, `/reset-password`
- Protected shell routes: `/dashboard`, `/models`, `/models/:id`, `/endpoints`, `/statistics`, `/settings`, `/proxy-api-keys`, `/pricing-templates`, `/request-logs`
- Root redirect: `/` -> `/dashboard`

## DOMAINS

- Observability: `DashboardPage.tsx`, `StatisticsPage.tsx`, `RequestLogsPage.tsx`
- Configuration: `ModelsPage.tsx`, `ModelDetailPage.tsx`, `EndpointsPage.tsx`, `PricingTemplatesPage.tsx`
- Settings: `SettingsPage.tsx` plus local `settings/sections/`, `settings/costing/`, and `settings/dialogs/`
- Access and recovery: `LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `ProxyApiKeysPage.tsx`

## WHERE TO LOOK

- Route mount list, public auth split, and protected shell boundary: `../App.tsx`
- Dashboard bootstrap, realtime reconciliation, and routing-diagram cluster: `DashboardPage.tsx`, `dashboard/AGENTS.md`
- Model detail bootstrap, connection flows, health checks, and loadbalance events: `ModelDetailPage.tsx`, `model-detail/AGENTS.md`
- Statistics tabs, shared query params, polling, and reports: `StatisticsPage.tsx`, `statistics/AGENTS.md`
- Settings section registry, save-state rendering, and child-doc delegation: `SettingsPage.tsx`, `settings/AGENTS.md`
- Models table, dialog state, and 24h metric hydration: `ModelsPage.tsx`, `models/AGENTS.md`
- Endpoint CRUD and reorder helpers: `EndpointsPage.tsx`, `endpoints/AGENTS.md`
- Pricing template form normalization and conflict handling: `PricingTemplatesPage.tsx`, `pricing-templates/AGENTS.md`
- Proxy API key issuance, rotation, and one-time secret display: `ProxyApiKeysPage.tsx`, `proxy-api-keys/AGENTS.md`
- Request-log investigation flow, filters, and detail drawer: `RequestLogsPage.tsx`, `request-logs/AGENTS.md`

## CHILD DOCS

- `dashboard/AGENTS.md`: dashboard bootstrap, realtime updates, and the local routing-diagram cluster.
- `endpoints/AGENTS.md`: endpoint CRUD dialogs, summary cards, bootstrap, and reorder helpers.
- `model-detail/AGENTS.md`: model bootstrap, connection mutations, health checks, loadbalance events, and the local `connections-list/` cluster.
- `models/AGENTS.md`: models toolbar, table, dialog state, and 24h metrics hook.
- `pricing-templates/AGENTS.md`: pricing template CRUD dialogs, usage lookup, and conflict handling.
- `proxy-api-keys/AGENTS.md`: proxy-key issuance, rotation, delete confirmation, and auth-status UX.
- `request-logs/AGENTS.md`: investigation flow, query params, and payload inspection.
- `settings/AGENTS.md`: settings page shell, section navigation, save-state helpers, and delegation to `sections/AGENTS.md` and `costing/AGENTS.md`.
- `statistics/AGENTS.md`: operations, throughput, and spending tabs with shared URL-state and local subfolder coverage.

## CONVENTIONS

- Keep backend access on `api.*` through the shared frontend client boundary. Page helpers can shape params and state, but they should not invent new fetch layers.
- Let route files own bookmarkable search-param state, selected dialog identity, and top-level redirects. Move dense logic into local helpers once the contract stabilizes.
- Refresh page data from `ProfileContext.revision` when profile-scoped state changes.
- Prefer shared loaders in `@/lib/referenceData` before adding another page-local cache for models, endpoints, providers, connections, or pricing templates.
- Dashboard live updates flow through `useRealtimeData()`. Statistics and model-detail loadbalance events stay on REST hooks, polling, and manual refresh controls.

## ANTI-PATTERNS

- Do not treat auth pages as protected-shell pages. `/login`, `/forgot-password`, and `/reset-password` intentionally bypass `ProfileProvider`.
- Do not duplicate query-param parsing inline across pages when a local helper already owns that contract.
- Do not open page-specific websocket clients when `useRealtimeData()` and `src/lib/websocket.ts` already own subscription behavior.
- Do not create extra AGENTS files for local page clusters that are already parent-covered, including `dashboard/routing-diagram/`, `model-detail/connections-list/`, `statistics/operations/`, and `statistics/spending/`.
