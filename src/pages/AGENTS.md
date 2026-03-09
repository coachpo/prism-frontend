# FRONTEND PAGES KNOWLEDGE BASE

## OVERVIEW
`src/pages/` is the feature layer. It contains the route components plus page-specific helper folders for complex state, filter parsing, dialogs, auth recovery, and sectioned settings UI.

## DOMAINS

- Configuration: `ModelsPage.tsx`, `ModelDetailPage.tsx`, `EndpointsPage.tsx`, `PricingTemplatesPage.tsx`
- Observability: `DashboardPage.tsx`, `StatisticsPage.tsx`, `RequestsPage.tsx`
- Settings: `SettingsPage.tsx` with `settings/sections/` and `settings/dialogs/`
- Access + recovery: `LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `ProxyApiKeysPage.tsx`

## WHERE TO LOOK

- Model detail state extraction: `model-detail/useModelDetailData.ts`
- Endpoint CRUD + drag reorder: `EndpointsPage.tsx`, `endpoints/EndpointDialog.tsx`, `endpoints/endpointCardHelpers.ts`
- Statistics filter sync: `StatisticsPage.tsx`, `statistics/queryParams.ts`, `statistics/AGENTS.md`
- Request-log filter sync and triage: `RequestsPage.tsx`, `request-logs/queryParams.ts`, `request-logs/formatters.ts`
- Settings section navigation and save-state rendering: `SettingsPage.tsx`, `settings/useSettingsSectionNavigation.ts`, `settings/sectionSaveState.tsx`, `settings/AGENTS.md`
- Operator auth setup and verified-email flow: `settings/sections/AuthenticationSection.tsx`
- Proxy API key issuance, rotation, and one-time secret display: `ProxyApiKeysPage.tsx`
- Pricing template form normalization: `pricing-templates/pricingTemplateFormState.ts`

## CHILD DOCS

- `settings/AGENTS.md`: section/dialog architecture, auth setup, destructive flow patterns.
- `statistics/AGENTS.md`: operations vs spending tabs, shared query-param contract, and data-hook boundaries.

## CONVENTIONS

- Keep page-level backend access on `api.*`; page helpers can shape params and state, but they should not invent new fetch layers.
- When filter state becomes non-trivial, move parsing/default logic into a page-local `queryParams.ts` module and keep URL state bookmarkable.
- When a page grows multiple related async flows and dialogs, extract a focused hook/helper module instead of letting the route component own everything; `model-detail/useModelDetailData.ts` is the current pattern.
- Refresh page data from `ProfileContext.revision` when scoped state changes.
- Fetch parallel data with `Promise.all` when the page needs related lists, metrics, or dropdown inputs at the same time.
- For mixed-success bootstrap work, prefer `Promise.allSettled`; `ProxyApiKeysPage.tsx` uses that pattern to keep auth status and key lists partially recoverable.
- Keep Settings split by section/dialog helper files rather than expanding `SettingsPage.tsx` with more inline UI branches.

## PAGE FACTS

- `StatisticsPage.tsx` syncs both operations and spending tabs into the URL and uses dedicated parsing helpers in `statistics/queryParams.ts`.
- `RequestsPage.tsx` maintains request-log filters, view modes, latency buckets, and triage presets through `request-logs/queryParams.ts`.
- `ModelDetailPage.tsx` delegates most state and async behavior to `model-detail/useModelDetailData.ts`, including health checks, reorder flows, and focused-connection navigation.
- `ProxyApiKeysPage.tsx` loads auth settings and key inventory in parallel, shows a full secret once, and treats rotate/delete as first-class page actions.
- `PricingTemplatesPage.tsx` validates currency codes and non-negative decimal strings before saving template prices.
- `SettingsPage.tsx` is modular internally even though the route file is large; treat `settings/sections/` and `settings/dialogs/` as the extension points, especially for auth and destructive settings flows.

## ANTI-PATTERNS

- Do not duplicate URL param parsing inline across observability pages when a local `queryParams.ts` already owns that logic.
- Do not bypass `useProfileContext()` for selected-profile labels or refresh triggers.
- Do not mix destructive settings flows into generic dialogs without explicit confirmation copy.
- Do not treat auth pages as protected-shell pages; `/login`, `/forgot-password`, and `/reset-password` intentionally bypass `ProfileProvider`.
- Do not document or build new UI flows around a mounted `/audit` page route unless `src/App.tsx` actually adds it.
