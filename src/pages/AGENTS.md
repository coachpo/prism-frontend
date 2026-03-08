# FRONTEND PAGES KNOWLEDGE BASE

## OVERVIEW
`src/pages/` is the feature layer. It contains the route components plus page-specific helper folders for complex state, filter parsing, dialogs, and sectioned UIs.

## DOMAINS

- Configuration: `ModelsPage.tsx`, `ModelDetailPage.tsx`, `EndpointsPage.tsx`, `PricingTemplatesPage.tsx`
- Observability: `DashboardPage.tsx`, `StatisticsPage.tsx`, `RequestsPage.tsx`
- Settings: `SettingsPage.tsx` with `settings/sections/` and `settings/dialogs/`

## WHERE TO LOOK

- Model detail state extraction: `model-detail/useModelDetailData.ts`
- Endpoint CRUD + drag reorder: `EndpointsPage.tsx`, `endpoints/EndpointDialog.tsx`, `endpoints/endpointCardHelpers.ts`
- Statistics filter sync: `StatisticsPage.tsx`, `statistics/queryParams.ts`
- Request-log filter sync and triage: `RequestsPage.tsx`, `request-logs/queryParams.ts`, `request-logs/formatters.ts`
- Settings section navigation and save-state rendering: `SettingsPage.tsx`, `settings/useSettingsSectionNavigation.ts`, `settings/sectionSaveState.tsx`
- Pricing template form normalization: `pricing-templates/pricingTemplateFormState.ts`

## CONVENTIONS

- Keep page-level backend access on `api.*`; page helpers can shape params and state, but they should not invent new fetch layers.
- When filter state becomes non-trivial, move parsing/default logic into a page-local `queryParams.ts` module and keep URL state bookmarkable.
- When a page grows multiple related async flows and dialogs, extract a focused hook/helper module instead of letting the route component own everything; `model-detail/useModelDetailData.ts` is the current pattern.
- Refresh page data from `ProfileContext.revision` when scoped state changes.
- Fetch parallel data with `Promise.all` when the page needs related lists, metrics, or dropdown inputs at the same time.
- Keep Settings split by section/dialog helper files rather than expanding `SettingsPage.tsx` with more inline UI branches.

## PAGE FACTS

- `StatisticsPage.tsx` syncs both operations and spending tabs into the URL and uses dedicated parsing helpers in `statistics/queryParams.ts`.
- `RequestsPage.tsx` maintains request-log filters, view modes, latency buckets, and triage presets through `request-logs/queryParams.ts`.
- `ModelDetailPage.tsx` delegates most state and async behavior to `model-detail/useModelDetailData.ts`, including health checks, reorder flows, and focused-connection navigation.
- `PricingTemplatesPage.tsx` validates currency codes and non-negative decimal strings before saving template prices.
- `SettingsPage.tsx` is modular internally even though the route file is large; treat `settings/sections/` and `settings/dialogs/` as the extension points.

## ANTI-PATTERNS

- Do not duplicate URL param parsing inline across observability pages when a local `queryParams.ts` already owns that logic.
- Do not bypass `useProfileContext()` for selected-profile labels or refresh triggers.
- Do not mix destructive settings flows into generic dialogs without explicit confirmation copy.
- Do not document or build new UI flows around a mounted `/audit` page route unless `src/App.tsx` actually adds it.
