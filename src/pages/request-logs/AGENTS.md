# FRONTEND REQUEST LOGS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/request-logs/` owns the investigation flow for proxy traffic: filtering, searching, and detailed payload inspection.

## STRUCTURE
```
request-logs/
├── queryParams.ts               # URL-state contract for filters and pagination
├── useRequestLogPageState.ts    # Search-param orchestration and exact-request mode
├── useRequestLogsPageData.ts    # Server fetches and filter-option bootstrap
├── useAuditDetail.ts            # Lazy audit detail lookup and retry behavior
├── clientFilters.ts             # Local triage/search refinement over fetched rows
├── FiltersBar.tsx               # UI for search, status, and provider filters
├── RequestLogsTable.tsx         # Paginated and virtualized log list
├── RequestLogDetailSheet.tsx    # Detailed request/audit payload view
├── RequestFocusBanner.tsx       # Exact-request mode banner and exit action
└── __tests__/                   # Query-param, filter, and audit-detail coverage
```

## WHERE TO LOOK
- Investigation flow and state: `useRequestLogsPageData.ts`, `useRequestLogPageState.ts`
- Filter contract and defaults: `queryParams.ts`
- Client-side refinement and triage: `clientFilters.ts`
- Payload inspection and lazy audit fetch: `RequestLogDetailSheet.tsx`, `useAuditDetail.ts`

## CONVENTIONS
- Treat URL as the source of truth for all filters to support deep-linking.
- Use client-side filters for rapid refinement over the current fetched page.
- Keep audit payload fetching lazy and isolated from the main request-list fetch lifecycle.
- Use exact-request mode (`request_id`) to switch from paginated browsing to a single-request investigation workflow.

## ANTI-PATTERNS
- Do not stale-claim that request logs are missing from the route map.
- Do not duplicate filter parsing outside `queryParams.ts`.
- Do not fetch audit payloads during normal table browsing when the detail drawer is closed.
