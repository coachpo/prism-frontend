# FRONTEND REQUEST LOGS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/request-logs/` is the helper cluster behind `../RequestsPage.tsx`: bookmarkable request filters, view and triage modes, table column sets, exact-request focus, and a side sheet that lazily resolves linked audit payloads.

## STRUCTURE
```
request-logs/
├── queryParams.ts          # Typed filter enums, defaults, parsers, option metadata
├── FiltersBar.tsx          # Triage chips, search, filter controls, clear/reset UX
├── RequestLogsTable.tsx    # View-based columns, sticky all-columns mode, pagination
├── RequestLogDetailSheet.tsx # Overview and audit tabs for the selected request
├── columns.tsx             # Column presets and header labels per view
├── formatters.ts           # Error, currency, latency, and metric-availability helpers
└── HeaderWithTooltip.tsx   # Shared header presentation helper
```

## WHERE TO LOOK

- Route shell, `searchParams` sync, server fetches, exact request focus: `../RequestsPage.tsx`
- Typed query-param contract and filter defaults: `queryParams.ts`
- Filter and triage controls: `FiltersBar.tsx`
- Column presets, pagination, and sticky all-columns rendering: `RequestLogsTable.tsx`, `columns.tsx`
- Selected-request drawer, linked audit lookup, and export actions: `RequestLogDetailSheet.tsx`
- Error, latency, and currency formatting helpers: `formatters.ts`

## CONVENTIONS

- `RequestsPage.tsx` owns `searchParams` synchronization, server-side request fetches, and exact-request focus via `request_id`; helper files consume typed state.
- Keep filter defaults and enum parsing in `queryParams.ts`; UI components should not interpret raw `URLSearchParams` themselves.
- Apply client-side search, triage, token-range, and latency filters on top of the server-filtered page result instead of scattering that logic across table cells.
- Resolve linked audit payloads lazily when the detail sheet switches to the `audit` tab.
- Keep reusable formatting and metric-availability rules in `formatters.ts` so the table and detail sheet render the same semantics.

## ANTI-PATTERNS

- Do not duplicate query-param parsing or default logic outside `queryParams.ts`.
- Do not fetch audit detail eagerly from the page shell when the drawer can load it on demand.
- Do not re-implement error, latency, or currency formatting inside table or sheet components.
- Do not treat `request_id` focus mode as a normal paginated list; it is a targeted investigation path with its own empty-state behavior.
