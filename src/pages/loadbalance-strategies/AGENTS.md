# FRONTEND LOADBALANCE STRATEGIES DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/loadbalance-strategies/` owns the dedicated strategy-management route behind `../LoadbalanceStrategiesPage.tsx`. It covers the profile-scoped strategy list, create or edit dialog flows, delete confirmation, and the form normalization that mirrors the backend adaptive `routing_policy` contract for native-model routing.

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
- Form defaults, validation, and request payload shaping for adaptive `routing_policy`, including circuit-breaker status codes, cooldown tuning, and ban policy: `loadbalanceStrategyFormState.ts`
- Table rendering and destructive flow entrypoints: `LoadbalanceStrategiesTable.tsx`, `DeleteLoadbalanceStrategyDialog.tsx`

## CONVENTIONS

- Keep backend access on the shared `api.*` boundary; this page should not create a parallel fetch layer.
- Keep strategy form normalization and request shaping in `loadbalanceStrategyFormState.ts` rather than scattering the rules across dialogs.
- Match the CRUD/page shell pattern used by other profile-scoped management pages such as pricing templates.
- Keep adaptive routing editing on the existing strategy dialog; model pages still only attach one reusable strategy.
- Keep routing objective, circuit-breaker thresholds, status-code policy, and ban escalation on the existing strategy dialog instead of reintroducing retired strategy-type selectors.
- Keep circuit-breaker status-code editing inside `loadbalanceStrategyFormState.ts`; do not reintroduce the removed legacy recovery-only contract.
- Keep ban-escalation defaults, validation, and payload normalization in `loadbalanceStrategyFormState.ts`; the dialog should only render and mutate those fields.
- Keep compact adaptive-routing summary wording in `LoadbalanceStrategiesTable.tsx`; do not duplicate circuit-breaker summary formatting elsewhere.
- When doing upgrade work, backward compatibility with the pre-upgrade implementation is not a goal unless explicitly requested. Do not add compatibility shims, dual paths, or fallback behavior solely to preserve the old interface.

## ANTI-PATTERNS

- Do not let table components own API calls directly when `useLoadbalanceStrategiesPageData.ts` already centralizes CRUD orchestration.
- Do not reintroduce model-level cooldown or legacy failover-policy fields outside this strategy UI.
- Do not split ban controls into a second dialog or page; they belong to the existing strategy dialog.
- Do not create a second policy-management page or move strategy assignment out of the existing model dialogs.
