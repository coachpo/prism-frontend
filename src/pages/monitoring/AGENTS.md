# FRONTEND MONITORING PAGE CLUSTER KNOWLEDGE BASE

## OVERVIEW
`pages/monitoring/` is the shared monitoring page cluster behind the mounted `../MonitoringPage.tsx` route shell and the local `../MonitoringVendorPage.tsx` and `../MonitoringModelPage.tsx` drill-down page components. It owns monitoring polling cadence, overview or drill-down data hooks, vendor and connection tables, recent history rendering, and manual probe interactions.

## STRUCTURE
```
monitoring/
├── MonitoringOverviewGroups.tsx        # Overview vendor-group cards and collapsible connection summaries
├── MonitoringVendorModelsTable.tsx     # Vendor drill-down model table
├── MonitoringModelConnectionsTable.tsx # Model drill-down connection rows and manual probe actions
├── MonitoringModelHistoryCard.tsx      # Recent probe history across model connections
├── monitoringPolling.ts                # Poll-interval clamping and settings fetch
├── useMonitoringOverviewData.ts        # Overview polling hook
├── useMonitoringVendorData.ts          # Vendor drill-down polling hook
├── useMonitoringModelData.ts           # Model drill-down polling + manual probe hook
└── __tests__/                          # Monitoring page-cluster i18n and hook coverage
```

## WHERE TO LOOK
- Mounted monitoring route shell plus local vendor/model drill-down page components that hand off into this cluster: `../MonitoringPage.tsx`, `../MonitoringVendorPage.tsx`, `../MonitoringModelPage.tsx`
- Poll-interval loading, clamping, and milliseconds conversion: `monitoringPolling.ts`
- Overview polling and vendor-group presentation: `useMonitoringOverviewData.ts`, `MonitoringOverviewGroups.tsx`
- Vendor drill-down polling and model list presentation: `useMonitoringVendorData.ts`, `MonitoringVendorModelsTable.tsx`
- Model drill-down polling, manual probe flow, connection table, and recent history: `useMonitoringModelData.ts`, `MonitoringModelConnectionsTable.tsx`, `MonitoringModelHistoryCard.tsx`
- Local regression coverage: `__tests__/MonitoringPageShell.i18n.test.tsx`, `__tests__/MonitoringOverviewGroups.test.tsx`, `__tests__/useMonitoringModelData.test.tsx`

## CONVENTIONS
- Keep the mounted monitoring route shell and the two local drill-down page components thin; polling, fetch sequencing, and error state live in the local hooks.
- Keep `monitoringPolling.ts` as the single source of truth for settings-backed interval clamping.
- Keep manual probe orchestration in `useMonitoringModelData.ts`; table components should emit actions, not call APIs directly.
- Keep user-facing copy and empty states on the shared locale boundary through `useLocale()`.
- When doing upgrade work, backward compatibility with the pre-upgrade implementation is not a goal unless explicitly requested. Prefer the best current implementation shape over preserving the old one. Do not add compatibility shims, dual paths, or fallback behavior solely to preserve the old interface.

## ANTI-PATTERNS
- Do not duplicate polling timers or interval math across the three monitoring hooks.
- Do not call monitoring APIs directly from table or card components when the hooks already own request sequencing.
- Do not split `__tests__/` into a separate AGENTS file while this parent already owns the local regression cluster.
