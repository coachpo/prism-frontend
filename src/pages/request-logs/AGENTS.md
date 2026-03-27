# FRONTEND REQUEST LOGS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/request-logs/` owns the investigation flow for proxy traffic: filtering, searching, exact-request focus mode, and detailed payload inspection. This parent also covers the local `detail/` cluster, while request URL-state and exact-request behavior stay local here.

## STRUCTURE
```
request-logs/
├── queryParams.ts               # URL-state contract for filters and pagination
├── useRequestLogPageState.ts    # Search-param orchestration and exact-request mode
├── useRequestLogsPageData.ts    # Server fetches and filter-option bootstrap
├── useAuditDetail.ts            # Lazy audit detail lookup and retry behavior
├── clientFilters.ts             # Local triage/search refinement over fetched rows
├── columns.tsx                  # Table column definitions and detail entry affordances
├── FiltersBar.tsx               # UI for search, status, and api_family filters
├── FiltersBar.constants.ts      # Filter option constants and shared filter presentation helpers
├── FiltersBarPrimaryFilters.tsx # Primary filter row composition
├── FiltersBarSecondaryFilters.tsx # Secondary filter row composition
├── RequestLogsTable.tsx         # Paginated and virtualized log list
├── RequestLogDetailSheet.tsx    # Detailed request/audit payload view
├── RequestFocusBanner.tsx       # Exact-request mode banner and exit action
├── connectionNavigation.ts      # Connection-jump helpers for request-log detail context
├── detail/                      # Parent-covered overview, audit, payload, and shared detail helpers
└── __tests__/                   # Query-param, filter, table, and audit-detail coverage
```

## WHERE TO LOOK
- Investigation flow and state, including URL-state and exact-request mode: `useRequestLogsPageData.ts`, `useRequestLogPageState.ts`
- Route-shell copy, empty-state messaging, and locale-aware detail labels: `../RequestLogsPage.tsx`, `@/i18n/useLocale`, `@/i18n/AGENTS.md`
- Filter contract and defaults, including `api_family`: `queryParams.ts`
- Client-side refinement and triage: `clientFilters.ts`
- Table columns, row actions, and detail-entry affordances: `columns.tsx`, `RequestLogsTable.tsx`
- Split filter-row composition and shared filter constants: `FiltersBar.constants.ts`, `FiltersBarPrimaryFilters.tsx`, `FiltersBarSecondaryFilters.tsx`, `FiltersBar.tsx`
- Payload inspection and lazy audit fetch: `RequestLogDetailSheet.tsx`, `useAuditDetail.ts`
- Connection navigation helpers for request-log detail context: `connectionNavigation.ts`
- Parent-covered detail cluster helpers: `detail/RequestLogOverviewTab.tsx`, `detail/RequestLogAuditTab.tsx`, `detail/RequestLogPayloadBlock.tsx`, `detail/requestLogDetailShared.tsx`, `detail/requestLogDetailUtils.ts`

## CONVENTIONS
- Treat URL as the source of truth for all filters to support deep-linking.
- Use client-side filters for rapid refinement over the current fetched page.
- Keep audit payload fetching lazy and isolated from the main request-list fetch lifecycle.
- Use exact-request mode (`request_id`) to switch from paginated browsing to a single-request investigation workflow, and keep that mode local to the request-logs page.
- Treat `api_family` as the server-backed family filter and keep vendor identity out of request-log filtering.
- Keep user-facing copy on the shared locale boundary through `useLocale()`, while timestamp formatting continues to flow through `useTimezone()`.
- Keep `detail/` parent-covered here. Those helpers support the request-log sheet only and should not get a separate AGENTS file.

## ANTI-PATTERNS
- Do not stale-claim that request logs are missing from the route map.
- Do not duplicate filter parsing outside `queryParams.ts`.
- Do not fetch audit payloads during normal table browsing when the detail drawer is closed.
- Do not split `request-logs/detail/` into a separate AGENTS file while this parent already owns that cluster.
