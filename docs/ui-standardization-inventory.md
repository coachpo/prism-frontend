# Frontend UI standardization inventory

## Scope and counting rules

- Scope: all mounted frontend routes from `src/App.tsx` and their route-local subcomponents under `src/pages/**`.
- Canonical shared surface audited for this pass: `PageHeader`, `MetricCard`, `EmptyState`, `StatusBadge`, `ProviderSelect`, `ProviderIcon`, and `src/components/ui/*`.
- Usage counts below are **unique importing files** under `src/pages/**`, not raw JSX instance counts.
- This is a convergence pass, not a redesign. Non-equivalent local UI stays local and is documented as an intentional exception.

## Shared component adoption stats (by importing file)

| Shared surface | Importing files | Notes |
| --- | ---: | --- |
| `PageHeader` | 8 | Shared protected-shell header for `DashboardPage`, `ModelsPage`, `EndpointsPage`, `StatisticsPage`, `SettingsPage`, `ProxyApiKeysPage`, `PricingTemplatesPage`, and `RequestLogsPage`. |
| `MetricCard` | 5 | `dashboard/DashboardMetricsGrid.tsx`, `statistics/ThroughputTab.tsx`, `statistics/operations/OperationsHealthSection.tsx`, `statistics/spending/SpendingSummaryMetrics.tsx`, and `endpoints/EndpointsSummaryCards.tsx` after this pass. |
| `EmptyState` | 10 | Already adopted in dashboard, model-detail, endpoints, models, spending views, and `proxy-api-keys/ProxyKeysListCard.tsx` after this pass. |
| `StatusBadge` | 10 | Shared semantic badges across model detail, models, request logs, and settings save-state/audit flows. |
| `ProviderSelect` | 6 | Concentrated in models and statistics filtering/forms. |
| `ProviderIcon` | 8 | Shared provider branding across dashboard, models, model-detail, request logs, and settings audit toggles. |
| `src/components/ui/*` | route-wide | Ubiquitous across every mounted page; tracked as a family rather than collapsed into one numeric count because the import surface spans many primitives. |

## Mounted page inventory and decisions

| Mounted page | Shared components already used | Remaining local wrappers / audited groups | Decision | Rationale |
| --- | --- | --- | --- | --- |
| `/dashboard` (`DashboardPage.tsx`) | `PageHeader`, `MetricCard`, `EmptyState`, `ProviderIcon`, `ui/*` | `dashboard/DashboardHighlightsGrid.tsx` compact performance tiles; routing diagram cluster | **Inline thin tile wrapper; keep routing diagram local** | The local `DashboardMetricTile` wrapper was deleted in the second pass and its 2×2 tile markup now lives inline in `DashboardHighlightsGrid.tsx`, preserving the compact density and `ws-value-updated` behavior without broadening `MetricCard`. |
| `/models` (`ModelsPage.tsx`) | `PageHeader`, `EmptyState`, `StatusBadge`, `ProviderSelect`, `ProviderIcon`, `ui/*` | `models/ModelsToolbar.tsx`, `models/ModelsTable.tsx`, dialog/table shells | **Keep local** | These are route-specific table/filter compositions, not duplicated shared primitives. |
| `/models/:id` (`ModelDetailPage.tsx`) | `StatusBadge`, `EmptyState`, `ProviderIcon`, `ui/*` | Page-local hero header, overview cards, connections/events tabs | **Keep local** | The header combines back-navigation, badges, monospace metadata, and edit affordances that do not map cleanly to `PageHeader` without prop creep. |
| `/endpoints` (`EndpointsPage.tsx`) | `PageHeader`, `EmptyState`, `MetricCard` (after first pass), `ui/*` | `EndpointCard.tsx` DnD card shell and inline action pill | **Migrate summary cards; inline thin action wrapper** | `EndpointsSummaryCards.tsx` already converged onto `MetricCard` in the first pass. The second pass deleted `EndpointActionButton` and inlined the three local action buttons so the duplicate/edit/delete affordances keep the same labels, loading state, and styling without introducing a new shared primitive. |
| `/statistics` (`StatisticsPage.tsx`) | `PageHeader`, `MetricCard`, `EmptyState`, `ProviderSelect`, `ui/*` | `statistics/operations/chartPresentation.tsx` (`OperationsChartCard`) | **Keep local** | This helper is an operations-cluster shell, not a proven cross-route primitive. Forcing it onto `src/components/ui/chart.tsx` is explicitly out of scope for this pass. |
| `/settings` (`SettingsPage.tsx`) | `PageHeader`, `StatusBadge`, `ProviderIcon`, `ui/*` | `SettingsSectionsNav.tsx`, section shells, `AuthenticationSection.tsx`, `sections/authentication/PasskeysCard.tsx`, billing/timezone section shells | **Keep local** | Settings owns hash navigation, save-state wiring, and a mix of profile-scoped and global auth flows. Those section shells are intentionally clustered and not equivalent to a generic shared card abstraction. |
| `/proxy-api-keys` (`ProxyApiKeysPage.tsx`) | `PageHeader`, `EmptyState` (after first pass), `ui/*` | `ProxyKeyCreateCard.tsx`, `ProxyKeysListCard.tsx` shell, `ProxyKeyCard.tsx`, `ProxyKeyStatusCallout.tsx` | **Migrate empty placeholder; inline thin action wrapper** | The first pass moved the zero-state copy onto `EmptyState`. The second pass deleted `ProxyKeyActionButton` and inlined the edit/rotate/delete buttons in `ProxyKeyCard.tsx` while keeping the route-specific card, auth gating, one-time secret flow, and action cluster behavior local. |
| `/pricing-templates` (`PricingTemplatesPage.tsx`) | `PageHeader`, `ui/*` | Profile-scope banner, pricing template table/dialog shells | **Keep local** | These shells are specific to pricing template CRUD and profile-scope messaging, with no second consumer. |
| `/request-logs` (`RequestLogsPage.tsx`) | `PageHeader`, `StatusBadge`, `ProviderIcon`, `ui/*` | `request-logs/detail/requestLogDetailShared.tsx`, filters/table/detail sheet helpers | **Keep local** | The detail-row, summary-stat, and provider-pill helpers are request-log specific and tightly coupled to the investigation sheet semantics. |
| `/login` (`LoginPage.tsx`) | `ThemeToggle`, `ui/*` | Auth-page layout, topography background, passkey login shell | **Keep local** | Public auth routes intentionally bypass the protected app shell and own a branded login composition with passkey entry. |
| `/forgot-password` (`ForgotPasswordPage.tsx`) | `ui/*` | Local public-auth card layout | **Keep local** | Single-purpose recovery flow with no cross-route shell parity beyond shared UI primitives. |
| `/reset-password` (`ResetPasswordPage.tsx`) | `ui/*` | Local public-auth card layout | **Keep local** | Same rationale as forgot-password: public recovery flow, no second consumer for a shared route shell. |

## Candidate duplicate / orphan groups audited in this pass

| Group | Files | Decision | Rationale |
| --- | --- | --- | --- |
| Endpoint summary KPI cards | `src/pages/endpoints/EndpointsSummaryCards.tsx` → `src/components/MetricCard.tsx` | **Migrate now** | Proven equivalence: same 3-card grid, same labels/values, same last-card detail, and icon tinting can be preserved through shared styling hooks. |
| Proxy key zero-state placeholder | `src/pages/proxy-api-keys/ProxyKeysListCard.tsx` → `src/components/EmptyState.tsx` | **Migrate now** | Copy-only empty state with a local card shell around it; no new behavior required. |
| Dashboard compact metric tiles | `src/pages/dashboard/DashboardHighlightsGrid.tsx` | **Inline local wrapper now** | The second pass removed `DashboardMetricTile` and kept the compact tile markup inline so the 2×2 layout and `ws-value-updated` highlight remain unchanged without forcing a `MetricCard` migration. |
| Request-log detail helpers | `src/pages/request-logs/detail/requestLogDetailShared.tsx` | **Keep local** | Detail rows, section cards, and provider pill are specific to the request detail drawer. |
| Statistics operations chart shell | `src/pages/statistics/operations/chartPresentation.tsx` | **Keep local** | One-cluster consumer and chart abstraction changes are explicitly out of scope. |
| Endpoint action button | `src/pages/endpoints/EndpointCard.tsx` local `EndpointActionButton` | **Inline local wrapper now** | The second pass deleted the wrapper and inlined the three local buttons directly into the action pill, preserving the same button variant, accessible names, and duplicate spinner behavior. |
| Proxy key action button | `src/pages/proxy-api-keys/ProxyKeyCard.tsx` local `ProxyKeyActionButton` | **Inline local wrapper now** | The second pass deleted the wrapper and inlined the three local buttons directly into the action pill, preserving the same button variant, disabled states, and rotate spin behavior. |
| Settings section shells + auth/passkey cards | `src/pages/settings/**` | **Keep local** | Save-state, auth verification, passkey management, and section navigation are settings-specific contracts. |
| Auth route layouts | `src/pages/LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` | **Keep local** | Public-route layouts intentionally diverge from protected-shell page chrome. |
| Model detail header | `src/pages/ModelDetailPage.tsx` | **Keep local** | Route-specific back-nav and status badge composition are not equivalent to `PageHeader`. |

## Implemented changes in this pass

1. `src/pages/endpoints/EndpointsSummaryCards.tsx` now renders shared `MetricCard` instances while preserving the existing copy, 3-card layout, icon tinting, and the final card detail string.
2. `src/pages/proxy-api-keys/ProxyKeysListCard.tsx` now renders the zero-state through shared `EmptyState` while keeping the surrounding list card shell and non-empty row rendering local.
3. Focused regression coverage was added for the endpoint, proxy-key, and dashboard cleanup paths touched across the first and second passes.
4. `src/pages/dashboard/DashboardHighlightsGrid.tsx` now inlines the compact performance tile markup and removes the local `DashboardMetricTile` wrapper while keeping the same 2×2 snapshot presentation and `ws-value-updated` hook.
5. `src/pages/endpoints/EndpointCard.tsx` now inlines the duplicate, edit, and delete `Button` markup and removes the local `EndpointActionButton` wrapper without changing the endpoint action pill behavior.
6. `src/pages/proxy-api-keys/ProxyKeyCard.tsx` now inlines the edit, rotate, and delete `Button` markup and removes the local `ProxyKeyActionButton` wrapper without changing the proxy key action pill behavior.
