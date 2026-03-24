# FRONTEND MODEL DETAIL DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/model-detail/` owns the heavy route logic behind `../ModelDetailPage.tsx`: bootstrap and redirect handling, model data shaping, connection mutation flows, manual health checks, 24-hour KPIs, model-scoped loadbalance events, current cooldown state, and the local connection-list UI cluster.

## STRUCTURE
```
model-detail/
├── useModelDetailData.ts             # High-level page composition
├── useModelDetailBootstrap.ts        # Parallel bootstrap fetches and redirects
├── useModelDetailConnectionFlows.ts  # Create, edit, delete, and reorder orchestration
├── useModelDetailConnectionMutations.ts
├── useModelDetailDialogState.ts
├── useModelDetailDataSupport.ts      # Default form factories, redirect targets, optimistic helpers
├── useModelDetailModelForm.ts
├── useConnectionHealthChecks.ts
├── useConnectionFocus.ts
├── useModelDetailMetrics24h.ts
├── useModelLoadbalanceCurrentState.ts
├── OverviewCards.tsx
├── ConnectionsList.tsx
├── LoadbalanceEventsTab.tsx
├── ConnectionDialog.tsx
├── ModelSettingsDialog.tsx
├── useModelLoadbalanceEvents.ts
├── modelDetailMetricsAndPaths.ts     # Shared latency and connection-label helpers
└── connections-list/                 # Connection card, sortable shell, and list helpers
```

## WHERE TO LOOK

- Thin route shell: `../ModelDetailPage.tsx`
- High-level composition and page-owned side effects: `useModelDetailData.ts`
- Bootstrap fetches, focus handoff, and redirect handling: `useModelDetailBootstrap.ts`, `useConnectionFocus.ts`
- Connection create, edit, delete, and reorder flows: `useModelDetailConnectionFlows.ts`, `useModelDetailConnectionMutations.ts`, `useModelDetailDialogState.ts`
- Health checks and 24-hour KPI loading: `useConnectionHealthChecks.ts`, `useModelDetailMetrics24h.ts`, `OverviewCards.tsx`
- Default forms, redirect-target options, and optimistic helpers: `useModelDetailDataSupport.ts`, `useModelDetailModelForm.ts`
- Connection list shell plus local cluster: `ConnectionsList.tsx`, `connections-list/`
- Model-scoped loadbalance event refresh, paging, and detail wiring: `LoadbalanceEventsTab.tsx`, `useModelLoadbalanceEvents.ts`, `../../components/AGENTS.md`
- Current cooldown-state fetch and reset actions: `useModelLoadbalanceCurrentState.ts`
- Shared latency and connection-label formatting: `modelDetailMetricsAndPaths.ts`

## CONVENTIONS

- Keep `ModelDetailPage.tsx` thin. `useModelDetailData.ts` owns bootstrap, dialog state, and the cross-hook composition layer.
- Fetch model, endpoints, model list, and pricing templates in parallel during bootstrap.
- Use `Promise.allSettled` for health-check batches so one failing connection does not collapse the page.
- Keep model loadbalance current state in `useModelLoadbalanceCurrentState.ts`, including refresh and reset actions, instead of scattering cooldown state inside cards or tabs.
- Keep optimistic priority reordering in the hook layer plus the connection-list helpers, and revert UI order if the backend PATCH fails.
- Treat `connections-list/` as a local cluster that stays documented here. It supports the parent route and should not get its own AGENTS file.

## ANTI-PATTERNS

- Do not move orchestration state back into `ModelDetailPage.tsx`.
- Do not duplicate default form factories or redirect-target logic outside `useModelDetailDataSupport.ts`.
- Do not manage routing priority from `ConnectionDialog.tsx`. Ordering belongs to the connection-list flow.
- Do not split `connections-list/` into a separate AGENTS file. This parent doc owns that cluster.
