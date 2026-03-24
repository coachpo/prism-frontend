# FRONTEND PAGES KNOWLEDGE BASE

## OVERVIEW
`src/pages/` is the route-domain layer for Prism's mounted frontend pages. Route files own URL entrypoints and top-level handoff, while feature folders keep dense page logic close to each route. This parent doc maps the live route surface and tells readers which page parent already covers nearby local clusters.

## ROUTE SURFACE

- Public auth routes: `/login`, `/forgot-password`, `/reset-password`
- Protected shell routes: `/dashboard`, `/models`, `/models/:id`, `/endpoints`, `/loadbalance-strategies`, `/statistics`, `/settings`, `/proxy-api-keys`, `/pricing-templates`, `/request-logs`
- Root redirect: `/` -> `/dashboard`

## DOMAINS

- Auth entry and recovery: `LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`
- Observability: `DashboardPage.tsx`, `StatisticsPage.tsx`, `RequestLogsPage.tsx`
- Configuration and routing: `ModelsPage.tsx`, `ModelDetailPage.tsx`, `EndpointsPage.tsx`, `LoadbalanceStrategiesPage.tsx`, `PricingTemplatesPage.tsx`
- Access control and runtime credentials: `ProxyApiKeysPage.tsx`
- Settings shell: `SettingsPage.tsx` with local `settings/sections/`, `settings/costing/`, and `settings/dialogs/`

## WHERE TO LOOK

- Mounted route list, public auth split, and protected shell boundary: `../App.tsx`
- Dashboard bootstrap, realtime refresh, and parent-covered `dashboard/routing-diagram/` cluster: `DashboardPage.tsx`, `dashboard/AGENTS.md`
- Model detail bootstrap, current-state helpers, connection flows, and parent-covered `model-detail/connections-list/` cluster: `ModelDetailPage.tsx`, `model-detail/AGENTS.md`
- Statistics tab shell, shared URL state, polling, and parent-covered `statistics/operations/` and `statistics/spending/` clusters: `StatisticsPage.tsx`, `statistics/AGENTS.md`
- Settings tab shell, section navigation, save-state helpers, dialogs, and child-doc delegation: `SettingsPage.tsx`, `settings/AGENTS.md`
- Models table, dialogs, and metrics hydration: `ModelsPage.tsx`, `models/AGENTS.md`
- Endpoint CRUD and reorder helpers: `EndpointsPage.tsx`, `endpoints/AGENTS.md`
- Loadbalance strategy CRUD page and dialog flows: `LoadbalanceStrategiesPage.tsx`, `loadbalance-strategies/AGENTS.md`
- Pricing template normalization, usage lookup, and conflict handling: `PricingTemplatesPage.tsx`, `pricing-templates/AGENTS.md`
- Proxy API key issuance, reveal-once flow, rotation, delete flow, and edit coverage: `ProxyApiKeysPage.tsx`, `proxy-api-keys/AGENTS.md`
- Request-log filters, query state, and parent-covered request detail flow: `RequestLogsPage.tsx`, `request-logs/AGENTS.md`

## CHILD DOCS

- `dashboard/AGENTS.md`: dashboard bootstrap, realtime updates, and the local routing-diagram cluster.
- `endpoints/AGENTS.md`: endpoint CRUD dialogs, cards, bootstrap, and reorder helpers.
- `loadbalance-strategies/AGENTS.md`: strategy CRUD table, dialog, form normalization, and page bootstrap.
- `model-detail/AGENTS.md`: model bootstrap, current-state and connection flows, health checks, loadbalance events, and the local `connections-list/` cluster.
- `models/AGENTS.md`: models toolbar, table, dialogs, and 24-hour metrics hydration.
- `pricing-templates/AGENTS.md`: pricing template CRUD dialogs, usage lookup, and conflict handling.
- `proxy-api-keys/AGENTS.md`: proxy-key creation, edit and rotation flows, delete confirmation, and auth-status UX.
- `request-logs/AGENTS.md`: request-log investigation flow, query params, filters, and parent-owned detail behavior.
- `settings/AGENTS.md`: settings page shell, profile/global tab split, section navigation, save-state helpers, dialogs, and delegation to `sections/AGENTS.md` and `costing/AGENTS.md`.
- `statistics/AGENTS.md`: operations, throughput, and spending tabs with shared URL state and local subfolder coverage.

## CONVENTIONS

- Keep backend access on `api.*` through the shared frontend client boundary. Page helpers can shape params and UI state, but they should not invent parallel fetch layers.
- Let route files own bookmarkable query or hash state, route-entry redirects, and the first handoff into local hooks.
- Refresh profile-scoped page data from `ProfileContext.revision` instead of bolting on unrelated cache invalidation paths.
- Parent-cover local route clusters that do not need their own AGENTS file, including `dashboard/routing-diagram/`, `model-detail/connections-list/`, `statistics/operations/`, `statistics/spending/`, and request-log detail behavior under `request-logs/`.
- Keep auth pages outside the protected shell and outside `ProfileProvider` assumptions.

## ANTI-PATTERNS

- Do not treat auth pages as protected-shell pages. `/login`, `/forgot-password`, and `/reset-password` intentionally stay on the public side of the route split.
- Do not duplicate query-param or hash parsing inline when a route domain already owns that contract.
- Do not spin up page-specific websocket clients when shared realtime ownership already lives in `src/lib/websocket.ts` and `useRealtimeData()`.
- Do not create extra AGENTS files for local clusters already covered by their route parent.
