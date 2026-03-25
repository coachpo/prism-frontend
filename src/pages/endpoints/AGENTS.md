# FRONTEND ENDPOINTS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/endpoints/` owns endpoint CRUD, duplication, reorder behavior, summary cards, and card-level presentation behind `../EndpointsPage.tsx`. This page stays profile-scoped because endpoints are reusable credentials attached to the selected profile.

## STRUCTURE
```
endpoints/
├── EndpointDialog.tsx          # Create-edit form and field normalization
├── DeleteEndpointDialog.tsx    # Delete confirmation flow
├── EndpointCard.tsx            # Sortable endpoint card + overlay presentation
├── endpointCardHelpers.ts      # Card display helpers
├── EndpointsSummaryCards.tsx   # Top-level endpoint summary metrics
├── useEndpointBootstrapData.ts # Shared-cache bootstrap for endpoints and attached models
├── useEndpointReorder.ts       # Drag-and-drop reorder flow and optimistic state
└── useEndpointsPageData.ts     # Page-level orchestration for CRUD, duplicate, delete, and summaries
```

## WHERE TO LOOK

- Page orchestration and mutation handlers: `useEndpointsPageData.ts`
- Bootstrap and shared endpoint cache updates: `useEndpointBootstrapData.ts`
- Drag sensors, reorder guards, and optimistic order updates: `useEndpointReorder.ts`
- Form fields and endpoint payload shaping: `EndpointDialog.tsx`
- Sortable card rendering and model attachment display: `EndpointCard.tsx`, `endpointCardHelpers.ts`

## CONVENTIONS

- Reuse the shared endpoint cache in `@/lib/referenceData` instead of layering another endpoint-specific cache.
- Keep reorder state and DnD bookkeeping in `useEndpointReorder.ts`; cards stay presentational.
- Patch local endpoint state through `commitEndpoints()` after create, update, duplicate, delete, and reorder flows.

## ANTI-PATTERNS

- Do not mutate endpoint ordering directly inside card components.
- Do not duplicate endpoint form normalization outside `EndpointDialog.tsx`.
- Do not replace dependency-specific delete messaging with generic toast-only failures when the page already surfaces blocking reasons.
