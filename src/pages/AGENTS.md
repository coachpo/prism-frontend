# FRONTEND PAGES KNOWLEDGE BASE

## OVERVIEW
`src/pages/` is the feature route layer. Route files own URL-state orchestration, page bootstrapping, and selected dialog or drawer identity; helper folders own dense local logic once a page outgrows a single file.

## DOMAINS

- Configuration: `ModelsPage.tsx`, `ModelDetailPage.tsx`, `EndpointsPage.tsx`, `PricingTemplatesPage.tsx`
- Observability: `DashboardPage.tsx`, `StatisticsPage.tsx`, `RequestLogsPage.tsx`
- Settings: `SettingsPage.tsx` with `settings/sections/`, `settings/costing/`, and `settings/dialogs/`
- Access + recovery: `LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `ProxyApiKeysPage.tsx`

## WHERE TO LOOK

- Route mount list and auth shell split: `../App.tsx`
- Dashboard bootstrap and realtime flow: `DashboardPage.tsx`, `dashboard/AGENTS.md`
- Request-log investigation flow, filters, and detail: `RequestLogsPage.tsx`, `request-logs/AGENTS.md`
- Model detail route shell: `ModelDetailPage.tsx`, `model-detail/AGENTS.md`
- Models table, filters, dialog flow, and 24h metric hydration: `ModelsPage.tsx`, `models/AGENTS.md`
- Statistics filter sync and tab orchestration: `StatisticsPage.tsx`, `statistics/AGENTS.md`
- Settings section navigation and save-state rendering: `SettingsPage.tsx`, `settings/AGENTS.md`
- Endpoint CRUD and reorder helpers: `EndpointsPage.tsx`, `endpoints/EndpointDialog.tsx`, `endpoints/useEndpointReorder.ts`, `endpoints/endpointCardHelpers.ts`
- Model-scoped loadbalance event tab and detail sheet: `ModelDetailPage.tsx`, `model-detail/`, `../components/AGENTS.md`
- Pricing template form normalization and usage conflicts: `PricingTemplatesPage.tsx`, `pricing-templates/AGENTS.md`
- Proxy API key issuance, rotation, and one-time secret display: `ProxyApiKeysPage.tsx`, `proxy-api-keys/AGENTS.md`

## CHILD DOCS

- `dashboard/AGENTS.md`: bootstrap/realtime flow and routing-diagram visualization.
- `endpoints/AGENTS.md`: endpoint CRUD dialogs, summary cards, bootstrap, and reorder helpers.
- `models/AGENTS.md`: model toolbar, table, dialog state, and 24h metrics hook.
- `pricing-templates/AGENTS.md`: pricing template CRUD dialogs, usage lookup, and conflict handling.
- `proxy-api-keys/AGENTS.md`: proxy-key issuance, rotation, delete confirmation, and auth-status UX.
- `request-logs/AGENTS.md`: investigation flow, query params, and payload inspection.
- `settings/AGENTS.md`: section and dialog architecture, auth setup, destructive flow patterns.
- `statistics/AGENTS.md`: operations vs spending tabs, shared query-param contract, data-hook boundaries.
- `model-detail/AGENTS.md`: model detail orchestration, connection dialogs, reorder flow, and KPI helpers.

## CONVENTIONS

- Keep page-level backend access on `api.*`; page helpers can shape params and state, but they should not invent new fetch layers.
- Let route files own bookmarkable search-param state and selected drawer or dialog identity; move parsing and defaults into local `queryParams.ts` helpers once state becomes non-trivial.
- Extract heavy async and dialog orchestration into helper folders instead of letting the route file own everything; `model-detail/` remains the primary example.
- Refresh page data from `ProfileContext.revision` when scoped state changes.
- Prefer shared loaders in `@/lib/referenceData` before introducing another page-local cache for models, endpoints, providers, connections, or pricing templates.
- Dashboard realtime should flow through `useRealtimeData()`; statistics and loadbalance events refresh through their REST data hooks and page-level polling/manual refresh controls.
- Fetch related datasets in parallel with `Promise.all`; use `Promise.allSettled` for mixed-success bootstrap work.

## ANTI-PATTERNS

- Do not duplicate query-param parsing inline across pages when a local helper already owns that contract.
- Do not bypass `useProfileContext()` for selected-profile labels or refresh triggers.
- Do not mix destructive settings flows into generic dialogs without explicit confirmation copy.
- Do not treat auth pages as protected-shell pages; `/login`, `/forgot-password`, and `/reset-password` intentionally bypass `ProfileProvider`.
- Do not open page-specific websocket clients when `useRealtimeData()` and `src/lib/websocket.ts` already own subscription semantics.
