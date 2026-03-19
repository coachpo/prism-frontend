# FRONTEND MODEL DETAIL DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/model-detail/` owns the heavy lifting behind `../ModelDetailPage.tsx`: model bootstrap, connection CRUD, optimistic priority reorder, manual health-check orchestration, and 24-hour KPIs.

## STRUCTURE
```
model-detail/
├── useModelDetailData.ts             # High-level page composition
├── useModelDetailBootstrap.ts        # Parallel bootstrap fetches and redirects
├── useModelDetailConnectionFlows.ts  # Create/edit/delete/reorder flow orchestration
├── useModelDetailConnectionMutations.ts
├── useModelDetailDialogState.ts
├── useModelDetailDataSupport.ts      # Default form factories, redirect targets, optimistic helpers
├── useModelDetailModelForm.ts
├── useConnectionHealthChecks.ts
├── useConnectionFocus.ts
├── useModelDetailMetrics24h.ts
├── OverviewCards.tsx
├── ConnectionsList.tsx
├── LoadbalanceEventsTab.tsx
├── connections-list/                 # Connection card, sortable shell, list utils
├── ConnectionDialog.tsx
├── ModelSettingsDialog.tsx
├── useModelLoadbalanceEvents.ts
└── modelDetailMetricsAndPaths.ts     # Latency formatting and connection naming helpers
```

## WHERE TO LOOK

- Route shell: `../ModelDetailPage.tsx`
- Orchestration and composition: `useModelDetailData.ts`
- Bootstrap fetches, focus handoff, and redirects: `useModelDetailBootstrap.ts`, `useConnectionFocus.ts`
- Connection flow and mutation helpers: `useModelDetailConnectionFlows.ts`, `useModelDetailConnectionMutations.ts`, `useConnectionHealthChecks.ts`
- 24-hour KPI loading and shaping: `useModelDetailMetrics24h.ts`
- Default endpoint and connection forms, redirect-target options, optimistic helpers: `useModelDetailDataSupport.ts`, `useModelDetailModelForm.ts`
- KPI cards and model-level 24h summary display: `OverviewCards.tsx`
- Drag-and-drop connection list, focus ring, and 24-hour metrics cards: `ConnectionsList.tsx`, `connections-list/`
- Model-scoped loadbalance event paging, refresh, and detail drawer wiring: `LoadbalanceEventsTab.tsx`, `useModelLoadbalanceEvents.ts`, `../../components/AGENTS.md`
- Inline endpoint creation, custom headers, pricing template selection: `ConnectionDialog.tsx`
- Proxy redirect target editing: `ModelSettingsDialog.tsx`
- Latency formatting and connection naming helpers: `modelDetailMetricsAndPaths.ts`

## CONVENTIONS

- Keep `ModelDetailPage.tsx` thin; `useModelDetailData.ts` owns fetch orchestration, dialog state, and side effects.
- Fetch model, endpoints, model list, and pricing templates in parallel with `Promise.all`.
- Use `Promise.allSettled` for batch health checks so one failing connection does not collapse the page.
- Keep optimistic priority reordering in the hook plus `moveConnectionInList()`; revert UI order if the backend PATCH fails.
- Split connection mutations, dialog state, health checks, and focus parsing into dedicated hooks instead of letting one monolithic hook absorb every concern.
- Consume the `focus_connection_id` query param here and keep shared latency formatting in `modelDetailMetricsAndPaths.ts` instead of duplicating presentation helpers.

## ANTI-PATTERNS

- Do not move orchestration state back into `ModelDetailPage.tsx`.
- Do not duplicate default form factories or redirect-target logic outside `useModelDetailDataSupport.ts`.
- Do not manage routing priority from `ConnectionDialog.tsx`; ordering belongs to `ConnectionsList.tsx` plus the hook.
- Do not duplicate latency or connection-name formatting when `modelDetailMetricsAndPaths.ts` already owns it.
