# FRONTEND KNOWLEDGE BASE
## OVERVIEW
React 19 + TypeScript dashboard for Prism management workflows: profiles, models, endpoints, connections, statistics, request logs, audit logs, and settings. Built with Vite 7, Tailwind CSS 4, shadcn/ui, and React Router.

## STRUCTURE
```
src/
|- main.tsx                        # Bootstraps ThemeProvider, TooltipProvider, Toaster, App
|- App.tsx                         # BrowserRouter with ProfileProvider + AppLayout + 8 lazy routes
|- context/
|  `- ProfileContext.tsx           # Selected vs active profile state, localStorage persistence, API header sync
|- hooks/
|  |- useConnectionNavigation.ts   # Resolve connection owner and navigate to /models/:id with focus_connection_id
|  `- useTimezone.ts               # Timezone preference loader keyed by profile revision
|- lib/
|  |- api.ts                       # Central request wrapper + all /api namespace calls + X-Profile-Id injection
|  |- types.ts                     # Frontend schema contracts (snake_case, backend-aligned)
|  |- costing.ts                   # Micros/currency/pricing formatting helpers
|  |- timezone.ts                  # Timezone preference + timestamp formatting helpers
|  |- configImportValidation.ts    # Zod validator for config import payload (version 1)
|  `- utils.ts                     # Shared UI helpers
|- components/
|  |- layout/AppLayout.tsx         # Sidebar, profile switcher, selected/active mismatch UX, profile CRUD dialogs
|  |- statistics/                  # Special-token + top spending UI helpers (4 files)
|  |- ui/                          # shadcn/ui primitives
|  `- *.tsx                        # Shared app components (MetricCard, PageHeader, ProviderSelect, etc.)
|- pages/
|  |- DashboardPage.tsx
|  |- ModelsPage.tsx
|  |- ModelDetailPage.tsx
|  |- EndpointsPage.tsx
|  |- StatisticsPage.tsx
|  |- RequestLogsPage.tsx
|  |- AuditPage.tsx
|  `- SettingsPage.tsx
|- App.css
|- index.css
`- assets/
```

> Current route map (`App.tsx`):
- `/` -> redirect to `/dashboard`
- `/dashboard` -> `DashboardPage`
- `/models` -> `ModelsPage`
- `/models/:id` -> `ModelDetailPage`
- `/endpoints` -> `EndpointsPage`
- `/statistics` -> `StatisticsPage`
- `/request-logs` -> `RequestLogsPage`
- `/audit` -> `AuditPage`
- `/settings` -> `SettingsPage`

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Profile scope behavior | `src/context/ProfileContext.tsx`, `src/lib/api.ts` | `selectedProfileId` persisted as `prism.selectedProfileId`; `X-Profile-Id` added only for `/api/*` |
| Navigation to owning model | `src/hooks/useConnectionNavigation.ts` | Caches by profile (`Map<profileId, Map<connectionId, owner>>`) |
| Global shell + profile UX | `src/components/layout/AppLayout.tsx` | Shows selected/active mismatch and explicit activate action |
| API calls | `src/lib/api.ts` | All page-level backend calls should go through this module |
| Type alignment | `src/lib/types.ts` | Keep backend schema parity; snake_case keys are intentional |
| Config import UX + validation | `src/pages/SettingsPage.tsx`, `src/lib/configImportValidation.ts` | Validates canonical config contract before POST |
| Spending and operations views | `src/pages/StatisticsPage.tsx`, `src/pages/RequestLogsPage.tsx` | URL-synced filters and grouped analytics |
| Cost formatting | `src/lib/costing.ts` | Use helpers instead of rendering raw micros |
| Timezone behavior | `src/hooks/useTimezone.ts`, `src/lib/timezone.ts` | Time formatting follows backend preference with browser fallback |

## CONVENTIONS
- Prefer `@/` imports for `src` modules; relative imports still exist in a few local files and are acceptable when simple.
- Route/page data fetching should use `src/lib/api.ts`; do not introduce ad hoc fetch wrappers in pages.
- `ProfileContext` is the app-wide state for profile selection and activation UX; use it instead of duplicating profile state.
- `selected profile` (management scope) and `active profile` (runtime proxy scope) are intentionally different concepts in UI copy and behavior.
- Forms are mixed by design: some flows use `react-hook-form` + `zod`, others use local component state.
- Package manager is `pnpm` (`packageManager: pnpm@10.30.1`).

## ANTI-PATTERNS
- Do not bypass `src/lib/api.ts` for Prism backend requests in feature pages.
- Do not assume selected profile equals active runtime profile in UI logic.
- Do not remove confirmation guards around destructive Settings actions (import restore, delete retention operations).
- Do not add unsupported provider types in frontend enums/selectors (`openai`, `anthropic`, `gemini` only).
- Do not render raw micros values in user-facing spending/cost fields when helpers exist.
