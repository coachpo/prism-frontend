# FRONTEND MONITORING ROUTE KNOWLEDGE BASE

## OVERVIEW
`pages/monitoring/` is the shared helper cluster behind `../MonitoringPage.tsx`, `../MonitoringVendorPage.tsx`, and `../MonitoringModelPage.tsx`. It owns monitoring polling cadence, overview or drill-down data hooks, vendor and connection tables, recent history rendering, and manual probe interactions.

## STRUCTURE
```
monitoring/
├── MonitoringOverviewGroups.tsx        # Overview vendor-group cards linking into drill-down routes
├── MonitoringVendorModelsTable.tsx     # Vendor drill-down model table
├── MonitoringModelConnectionsTable.tsx # Model drill-down connection rows and manual probe actions
├── MonitoringModelHistoryCard.tsx      # Recent probe history across model connections
├── monitoringPolling.ts                # Poll-interval clamping and settings fetch
├── useMonitoringOverviewData.ts        # Overview polling hook
├── useMonitoringVendorData.ts          # Vendor drill-down polling hook
├── useMonitoringModelData.ts           # Model drill-down polling + manual probe hook
└── __tests__/                          # Route-shell i18n, vendor/model, and manual-probe coverage
```

## WHERE TO LOOK
- Thin route shells that hand off into this cluster: `../MonitoringPage.tsx`, `../MonitoringVendorPage.tsx`, `../MonitoringModelPage.tsx`
- Poll-interval loading, clamping, and milliseconds conversion: `monitoringPolling.ts`
- Overview polling and vendor-group presentation: `useMonitoringOverviewData.ts`, `MonitoringOverviewGroups.tsx`
- Vendor drill-down polling and model list presentation: `useMonitoringVendorData.ts`, `MonitoringVendorModelsTable.tsx`
- Model drill-down polling, manual probe flow, connection table, and recent history: `useMonitoringModelData.ts`, `MonitoringModelConnectionsTable.tsx`, `MonitoringModelHistoryCard.tsx`
- Local regression coverage: `__tests__/MonitoringPageShell.i18n.test.tsx`, `__tests__/MonitoringVendorPage.test.tsx`, `__tests__/MonitoringModelPage.test.tsx`, `__tests__/useMonitoringModelData.test.tsx`

## CONVENTIONS
- Keep the three route shells thin; polling, fetch sequencing, and error state live in the local hooks.
- Keep `monitoringPolling.ts` as the single source of truth for settings-backed interval clamping.
- Keep manual probe orchestration in `useMonitoringModelData.ts`; table components should emit actions, not call APIs directly.
- Keep user-facing copy and empty states on the shared locale boundary through `useLocale()`.

## ANTI-PATTERNS
- Do not duplicate polling timers or interval math across the three monitoring hooks.
- Do not call monitoring APIs directly from table or card components when the hooks already own request sequencing.
- Do not split `__tests__/` into a separate AGENTS file while this parent already owns the local regression cluster.
