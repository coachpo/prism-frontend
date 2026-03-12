# FRONTEND MODEL DETAIL DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/model-detail/` owns the heavy lifting behind `../ModelDetailPage.tsx`: model bootstrap, connection CRUD, optimistic priority reorder, auto health checks, 24-hour KPIs, and deep links into request logs.

## STRUCTURE
```
model-detail/
├── useModelDetailData.ts          # Page orchestration, fetches, dialogs, reorder, health checks
├── useModelDetailDataSupport.ts   # Default form factories, redirect-target logic, list transforms
├── OverviewCards.tsx              # KPI and spending cards
├── ConnectionsList.tsx            # Searchable sortable connection cards
├── ConnectionDialog.tsx           # Endpoint source, pricing template, custom header editor
├── ModelSettingsDialog.tsx        # Model identity and proxy-target editor
└── modelDetailMetricsAndPaths.ts  # 24h helpers, latency formatting, request-log deep links
```

## WHERE TO LOOK

- Route shell: `../ModelDetailPage.tsx`
- Orchestration, parallel fetches, dialog state, focus handoff: `useModelDetailData.ts`
- Default endpoint and connection forms, redirect-target options, optimistic reorder helpers: `useModelDetailDataSupport.ts`
- KPI cards and model-level 24h summary display: `OverviewCards.tsx`
- Drag-and-drop connection list, focus ring, request-log links: `ConnectionsList.tsx`
- Inline endpoint creation, custom headers, pricing template selection: `ConnectionDialog.tsx`
- Proxy redirect target editing: `ModelSettingsDialog.tsx`
- Request-log path building and latency formatting: `modelDetailMetricsAndPaths.ts`

## CONVENTIONS

- Keep `ModelDetailPage.tsx` thin; `useModelDetailData.ts` owns fetch orchestration, dialog state, and side effects.
- Fetch model, endpoints, model list, and pricing templates in parallel with `Promise.all`.
- Use `Promise.allSettled` for batch health checks so one failing connection does not collapse the page.
- Keep optimistic priority reordering in the hook plus `moveConnectionInList()`; revert UI order if the backend PATCH fails.
- Consume the `focus_connection_id` query param here and build request-log deep links with `buildRequestLogsPath()` instead of duplicating path logic in presentation components.

## ANTI-PATTERNS

- Do not move orchestration state back into `ModelDetailPage.tsx`.
- Do not duplicate default form factories or redirect-target logic outside `useModelDetailDataSupport.ts`.
- Do not manage routing priority from `ConnectionDialog.tsx`; ordering belongs to `ConnectionsList.tsx` plus the hook.
- Do not duplicate latency or request-log path formatting when `modelDetailMetricsAndPaths.ts` already owns it.
