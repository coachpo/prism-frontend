# FRONTEND STATISTICS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/statistics/` powers the three-tab analytics surface under `../StatisticsPage.tsx`: operations, throughput, and spending, all driven by shared URL-state parsing.

## STRUCTURE
```
statistics/
├── queryParams.ts               # Shared URL param parsing and defaults
├── OperationsTab.tsx
├── ThroughputTab.tsx
├── StatisticsPageSkeleton.tsx
├── SpendingTab.tsx
├── operations/                  # Operations-tab hooks and contracts
├── spending/                    # Spending-tab hooks
├── useStatisticsPageData.ts      # Shared bootstrap, polling, and refresh orchestration
├── useStatisticsFilterOptions.ts
├── useStatisticsPageState.ts
├── useStatisticsReports.ts
└── utils.ts                     # Shared helpers
```

## WHERE TO LOOK

- Route shell and shared page bootstrap: `../StatisticsPage.tsx`
- Shared query-param contract: `queryParams.ts`
- Operations-tab rendering: `OperationsTab.tsx`
- Throughput rendering: `ThroughputTab.tsx`
- Operations async data hook and presentation helpers: `operations/useOperationsTabData.ts`, `operations/`
- Spending-tab rendering and grouping UI: `SpendingTab.tsx`
- Spending async data hook and visualizations: `spending/useSpendingTabData.ts`, `spending/`
- Shared statistics cards and chart wrappers: `../../components/AGENTS.md`
- Page bootstrap, filter options, state orchestration, and report loading: `useStatisticsPageData.ts`, `useStatisticsFilterOptions.ts`, `useStatisticsPageState.ts`, `useStatisticsReports.ts`
- Periodic polling for data refresh: `useStatisticsPageData.ts` (uses `usePolling` hook)
- Timezone-aware formatting: `useTimezone` hook from `@/hooks/useTimezone`
- Shared presentation helpers: `utils.ts`

## CONVENTIONS

- Treat URL state as source of truth for filters, tabs, presets, and pagination; bookmarkability is intentional.
- Keep operations-specific and spending-specific async logic in their own hook folders instead of bloating the top-level tab components.
- Preserve the distinction between operations telemetry filters and spending aggregation filters even when labels overlap.
- Query-param helpers should own defaults and parsing; tabs should consume typed values, not raw `URLSearchParams`.
- Statistics polling refresh belongs in `useStatisticsPageData.ts`; tabs should react to refreshed state, not own subscriptions.

## ANTI-PATTERNS

- Do not duplicate filter parsing in tab components when `queryParams.ts` already owns it.
- Do not mix spending grouping and top-N rules into operations-table logic.
- Do not regress null-vs-zero rendering for usage or cost metrics; statistics pages rely on that distinction for triage.
- Do not implement separate polling mechanisms in tab components when `useStatisticsPageData.ts` already owns periodic refresh.
