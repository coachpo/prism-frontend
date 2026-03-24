# FRONTEND LOADBALANCE STRATEGIES DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/loadbalance-strategies/` owns the dedicated strategy-management route behind `../LoadbalanceStrategiesPage.tsx`. It covers the profile-scoped strategy list, create or edit dialog flows, delete confirmation, and the form normalization that mirrors the backend strategy contract.

## STRUCTURE
```
loadbalance-strategies/
├── LoadbalanceStrategiesTable.tsx     # Table rendering and row actions
├── LoadbalanceStrategyDialog.tsx      # Create-edit dialog
├── DeleteLoadbalanceStrategyDialog.tsx # Delete confirmation and dependency handling
├── loadbalanceStrategyFormState.ts    # Form defaults and payload transforms
└── useLoadbalanceStrategiesPageData.ts # Page bootstrap, CRUD orchestration, and local patching
```

## WHERE TO LOOK

- Route shell and page composition: `../LoadbalanceStrategiesPage.tsx`
- Strategy bootstrap, mutation orchestration, and optimistic patching: `useLoadbalanceStrategiesPageData.ts`
- Form defaults, validation, and request payload shaping: `loadbalanceStrategyFormState.ts`
- Table rendering and destructive flow entrypoints: `LoadbalanceStrategiesTable.tsx`, `DeleteLoadbalanceStrategyDialog.tsx`

## CONVENTIONS

- Keep backend access on the shared `api.*` boundary; this page should not create a parallel fetch layer.
- Keep strategy form normalization and request shaping in `loadbalanceStrategyFormState.ts` rather than scattering the rules across dialogs.
- Match the CRUD/page shell pattern used by other profile-scoped management pages such as pricing templates.

## ANTI-PATTERNS

- Do not add cooldown timing fields here; strategy timing remains global backend config, not page-managed state.
- Do not let table components own API calls directly when `useLoadbalanceStrategiesPageData.ts` already centralizes CRUD orchestration.
- Do not reintroduce model-level cooldown or failover-policy fields into the strategy UI.
