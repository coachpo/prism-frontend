# FRONTEND MODELS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/models/` owns model list filters, dialog state, native-vs-proxy form logic, and separate 24-hour metric hydration behind `../ModelsPage.tsx`.

## STRUCTURE
```
models/
├── ModelDialog.tsx         # Create-edit dialog
├── DeleteModelDialog.tsx   # Delete confirmation flow
├── modelFormState.ts       # Form defaults, payload transforms, native-target helpers
├── ModelsTable.tsx         # Filtered table rendering
├── ModelsToolbar.tsx       # Search, provider/status/type filters, column toggles
├── modelTableContracts.ts  # Column keys and table contracts
├── modelTableDefaults.ts   # Default visible column map
├── useModelMetrics24h.ts   # 24h metrics and spend hydration
└── useModelsPageData.ts    # Shared-cache bootstrap, local patching, dialog orchestration
```

## WHERE TO LOOK

- Shared model/provider bootstrap and mutation patching: `useModelsPageData.ts`
- Proxy/native form behavior and payload transforms: `modelFormState.ts`
- 24h metrics and spend overlays: `useModelMetrics24h.ts`
- Filter and column controls: `ModelsToolbar.tsx`, `modelTableContracts.ts`, `modelTableDefaults.ts`
- Table rendering and row actions: `ModelsTable.tsx`

## CONVENTIONS

- Bootstrap models and providers from `@/lib/referenceData`, then patch the local list with `setSharedModels()` after mutations.
- Keep proxy/native validation and provider-target selection rules in `modelFormState.ts` instead of scattering them across dialog components.
- Hydrate 24h metrics separately from the base model list so CRUD flows do not own observability queries.

## ANTI-PATTERNS

- Do not rebuild proxy/native form rules outside `modelFormState.ts`.
- Do not let table components own API calls; `useModelsPageData.ts` already centralizes list mutations.
- Do not fold metrics queries into the base list bootstrap when `useModelMetrics24h.ts` already isolates that concern.
