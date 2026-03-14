# FRONTEND REQUEST LOGS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/request-logs/` is the helper cluster behind `../RequestsPage.tsx`: bookmarkable request filters, view and triage modes, table column sets, exact-request focus, and a side sheet that lazily resolves linked audit payloads.

## STRUCTURE
```
request-logs/
├── queryParams.ts             # Typed filter enums, defaults, parsers, option metadata
├── requestLogFilters.ts       # Client-side quick-filter logic over server data
├── FiltersBar.tsx             # Triage chips, search, filter controls, clear/reset UX
├── filters-bar/               # Split filter groups and quick-filter controls
├── RequestLogsTable.tsx       # View-based columns, sticky all-columns mode, pagination
├── table/                     # Row and pagination helpers
├── RequestFocusBanner.tsx     # Exact-request focus state and exit UX
├── RequestLogDetailSheet.tsx  # Overview and audit tabs for the selected request
├── RequestLogAuditTab.tsx
├── RequestLogOverviewTab.tsx
├── columns.tsx
├── formatters.ts
├── useRequestLogPageState.ts
├── useRequestLogAuditDetail.ts
├── useRequestLogsPageData.ts
├── useRequestLogsRealtime.ts
└── HeaderWithTooltip.tsx
```

## WHERE TO LOOK

- Route shell and exact request focus entrypoint: `../RequestsPage.tsx`
- Typed query-param contract, defaults, and URL/search-param ownership: `queryParams.ts`, `useRequestLogPageState.ts`
- Filter and triage controls: `FiltersBar.tsx`, `filters-bar/`
- Column presets, pagination, and sticky all-columns rendering: `RequestLogsTable.tsx`, `columns.tsx`, `table/`
- Selected-request drawer, linked audit lookup, and export actions: `RequestLogDetailSheet.tsx`, `RequestLogAuditTab.tsx`, `RequestLogOverviewTab.tsx`, `useRequestLogAuditDetail.ts`
- Page bootstrap, server fetching, and websocket refresh: `useRequestLogsPageData.ts`, `useRequestLogsRealtime.ts`
- Error, latency, and currency formatting helpers: `formatters.ts`

## CONVENTIONS

- `RequestsPage.tsx` owns the route entrypoint, while `useRequestLogPageState.ts` owns the typed `searchParams` contract and exact-request focus state via `request_id`.
- Keep filter defaults and enum parsing in `queryParams.ts`; UI components should not interpret raw `URLSearchParams` themselves.
- Apply client-side search, triage, token-range, and latency filters on top of the server-filtered page result instead of scattering that logic across table cells.
- Resolve linked audit payloads lazily through `useRequestLogAuditDetail.ts` when the detail sheet switches to the `audit` tab.
- Realtime refresh for the request-log channel belongs in `useRequestLogsRealtime.ts`; detail components should consume refreshed data rather than subscribe directly.
- Keep reusable formatting and metric-availability rules in `formatters.ts` so the table and detail sheet render the same semantics.

## ANTI-PATTERNS

- Do not duplicate query-param parsing or default logic outside `queryParams.ts`.
- Do not fetch audit detail eagerly from the page shell when the drawer can load it on demand.
- Do not re-implement error, latency, or currency formatting inside table or sheet components.
- Do not treat `request_id` focus mode as a normal paginated list; it is a targeted investigation path with its own empty-state behavior.
- Do not open a second websocket path from request-log components when `useRequestLogsRealtime.ts` already owns audit-ready and dirty-state handling.
