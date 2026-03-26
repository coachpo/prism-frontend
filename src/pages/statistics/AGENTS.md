# FRONTEND STATISTICS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/statistics/` owns the analytics route behind `../StatisticsPage.tsx`: operations, throughput, and spending views, all driven by shared URL-state and page-level polling and report orchestration. Keep null-vs-zero semantics explicit here, especially for usage and cost triage, and keep request-telemetry filters aligned to `api_family`.

## STRUCTURE
```
statistics/
├── queryParams.ts                 # Shared URL param parsing and defaults
├── OperationsTab.tsx
├── ThroughputTab.tsx
├── SpendingTab.tsx
├── OperationsTabFilters.tsx
├── SpendingTabFilters.tsx
├── StatisticsPageSkeleton.tsx
├── useStatisticsPageData.ts       # Shared bootstrap, polling, and refresh orchestration
├── useStatisticsFilterOptions.ts
├── useStatisticsPageState.ts
├── useStatisticsReports.ts
├── utils.ts                       # Shared helpers
├── operations/                    # Operations charts, cards, types, and async hook
└── spending/                      # Spending summaries, tables, charts, and async hook
```

## WHERE TO LOOK

- Thin route shell and top-level tab orchestration: `../StatisticsPage.tsx`
- Shared query-param contract and defaults: `queryParams.ts`
- Page bootstrap, filter options, polling, and refresh orchestration: `useStatisticsPageData.ts`, `useStatisticsFilterOptions.ts`, `useStatisticsPageState.ts`, `useStatisticsReports.ts`
- Operations rendering and local cluster: `OperationsTab.tsx`, `OperationsTabFilters.tsx`, `operations/`
- Throughput rendering: `ThroughputTab.tsx`
- Spending rendering and local cluster: `SpendingTab.tsx`, `SpendingTabFilters.tsx`, `spending/`
- Shared statistics cards and chart wrappers: `../../components/AGENTS.md`
- Shared presentation helpers and timezone-aware formatting inputs: `utils.ts`, `@/hooks/useTimezone`

## CONVENTIONS

- Treat URL state as the source of truth for filters, tabs, presets, and pagination. Bookmarkability is part of the contract.
- Keep operations-specific async and presentation logic inside `operations/`, and spending-specific logic inside `spending/`, instead of bloating the top-level tab files.
- Preserve the split between operations telemetry filters, throughput views, and spending aggregation even when labels overlap. Request-log oriented statistics filters should use `api_family`, not vendor.
- Statistics polling belongs in `useStatisticsPageData.ts`. Tabs consume refreshed state, they do not own their own polling loops.
- The dense `operations/` and `spending/` subfolders stay parent-covered. Do not add extra AGENTS files for them.
- Keep null-vs-zero rendering differences visible in helpers and copy, so missing data stays distinct from a true zero value.

## ANTI-PATTERNS

- Do not duplicate filter parsing in tab components when `queryParams.ts` already owns it.
- Do not mix spending grouping and top-N rules into operations-table or throughput logic.
- Do not regress null-vs-zero rendering for usage or cost metrics. Statistics depends on that distinction for triage.
- Do not create standalone AGENTS files for `operations/` or `spending/`. This parent doc owns both local clusters.
