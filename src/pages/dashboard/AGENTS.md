# FRONTEND DASHBOARD DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/dashboard/` powers the realtime orchestration and routing visualization on the main landing page.

## STRUCTURE
```
dashboard/
├── useDashboardPageData.ts        # High-level page composition
├── useDashboardBootstrapData.ts   # Parallel bootstrap fetches and routing-diagram data load
├── useDashboardRealtime.ts        # Realtime subscription and coalesced reconciliation
├── DashboardMetricsGrid.tsx       # KPI grid and highlighted metrics
├── DashboardHighlightsGrid.tsx    # Provider and summary highlights
├── RecentActivityCard.tsx         # Recent requests list with insert highlighting
├── RoutingDiagramCard.tsx         # Routing diagram shell and drill-down entry points
└── routing-diagram/               # Diagram layout, chart, legend, tooltip, and node/link shapes
```

## WHERE TO LOOK
- High-level route data orchestration: `useDashboardPageData.ts`
- Initial bootstrap fan-out and routing-diagram payloads: `useDashboardBootstrapData.ts`
- Realtime payload flow: `useDashboardRealtime.ts` (consumes `dashboard.update` request-log, summary, provider, spending, throughput, and routing fields)
- Routing diagram aggregation and rendering: `routingDiagram.ts`, `routing-diagram/`
- Metric and recent-activity presentation: `DashboardMetricsGrid.tsx`, `RecentActivityCard.tsx`, `TopSpendingModelsCard.tsx`

## CONVENTIONS
- Dashboard uses `useRealtimeData()` for live updates.
- Reconnect and manual refresh fall back to REST reconciliation; the backend currently emits `dashboard.update` only.
- Keep routing-diagram layout/rendering isolated from bootstrap and realtime orchestration.
- Reuse shared reference-data loaders and keep dashboard-specific state shaping in the dashboard hooks.

## ANTI-PATTERNS
- Do not bypass `useDashboardRealtime.ts` for dashboard-specific live state.
- Do not hard-code routing-diagram data assembly in card components when `routingDiagram.ts` already owns that transformation.
