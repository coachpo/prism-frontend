# FRONTEND KNOWLEDGE BASE

## OVERVIEW

React 19 SPA dashboard for managing LLM proxy configuration — models, endpoints, health, request statistics, audit logs, and settings. Built with Vite 7, TypeScript 5.9, TailwindCSS 4, and shadcn/ui (new-york style).

## STRUCTURE

```
src/
├── main.tsx                    # Entry: StrictMode + ThemeProvider + TooltipProvider + Toaster + App
├── App.tsx                     # BrowserRouter with 6 routes inside AppLayout
├── pages/                      # 6 page components (2947 lines total)
│   ├── DashboardPage.tsx       # Overview of all models with health badges — 149 lines
│   ├── ModelsPage.tsx          # Model CRUD list — 465 lines
│   ├── ModelDetailPage.tsx     # Single model: endpoints, health checks, config — 581 lines
│   ├── StatisticsPage.tsx      # Request logs + aggregated stats with recharts — 429 lines
│   ├── AuditPage.tsx           # Audit log viewer with detail modal — 528 lines
│   └── SettingsPage.tsx        # Provider audit toggles + header blocklist + config export/import — 795 lines
├── components/
│   ├── layout/AppLayout.tsx    # Responsive sidebar nav (collapsible drawer on mobile, fixed on lg+) — 105 lines
│   ├── EmptyState.tsx          # Reusable empty state with icon, title, description, action — 26 lines
│   ├── MetricCard.tsx          # Metric display card with icon, trend, click handler — 55 lines
│   ├── PageHeader.tsx          # Reusable page header with title, description, actions — 25 lines
│   ├── ProviderIcon.tsx        # SVG brand icons for OpenAI, Anthropic, Gemini — 51 lines
│   ├── StatusBadge.tsx         # Semantic color-coded badges (8 intent variants) — 60 lines
│   ├── ThemeToggle.tsx         # Dark/light mode toggle (next-themes) — 20 lines
│   ├── SwitchController.tsx   # react-hook-form controlled Switch wrapper — 38 lines
│   └── ui/                     # shadcn/ui primitives (22 components)
├── hooks/
│   └── useEndpointNavigation.ts # Navigate to model detail with endpoint focus + owner cache — 35 lines
├── lib/
│   ├── api.ts                  # Typed fetch wrapper — all backend API calls (6 namespaces) — 198 lines
│   ├── types.ts                # TypeScript interfaces mirroring backend schemas — 350 lines
│   └── utils.ts                # cn() + formatLabel() + formatProviderType() — 22 lines
└── assets/                     # Static assets (SVGs)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add API call | `lib/api.ts` | Add to `api` object, use `request<T>()` helper |
| Add/change types | `lib/types.ts` | Must match backend Pydantic schemas exactly (snake_case fields) |
| Add page | `App.tsx` (route) + `pages/` (component) + `AppLayout` (nav link) |
| Add UI component | `pnpm dlx shadcn add <name>` | Installs to `components/ui/` |
| Add reusable component | `components/` | See EmptyState, MetricCard, PageHeader, StatusBadge for patterns |
| Change API base URL | `VITE_API_BASE` env var | Default: same-origin `""` (local dev: `VITE_API_BASE=http://localhost:8000`) |
| Theming | `index.css` + `next-themes` | CSS variables (oklch color space) for light/dark, `--radius: 0.625rem` |
| Audit UI | `pages/AuditPage.tsx` | Log list + detail modal with request/response bodies |
| Provider settings | `pages/SettingsPage.tsx` | Audit toggles + config export/import |
| Charts/graphs | `pages/StatisticsPage.tsx` | Uses `recharts` library |
| Navigate to endpoint | `hooks/useEndpointNavigation.ts` | Resolves endpoint → model via API, caches owner |
| Format labels | `lib/utils.ts` | `formatLabel()` for snake_case→Title Case, `formatProviderType()` for display names |

## CONVENTIONS

- Import paths use `@/` alias (resolves to `src/`)
- All API calls go through `lib/api.ts` — never use raw `fetch()` in components
- Types in `lib/types.ts` use `snake_case` field names to match backend JSON responses
- Forms use `react-hook-form` + `zod` for validation
- Toast notifications via `sonner`
- Icons from `lucide-react`; provider brand icons via `components/ProviderIcon.tsx`
- Responsive layout: collapsible sidebar drawer on mobile, fixed on lg+
- No global state management — all state is local (useState) or URL-based (React Router params)
- All data fetched fresh from backend on page load — no client-side cache (except `useEndpointNavigation` owner cache)
- Package manager: pnpm 10.30.1 (pinned via `packageManager` field in package.json)
- No test framework configured — lint only (`pnpm run lint`)
- shadcn/ui components: badge, button, card, chart, collapsible, dialog, dropdown-menu, form, input, label, popover, progress, scroll-area, select, separator, sheet, skeleton, sonner, switch, table, tabs, tooltip

## ANTI-PATTERNS

- Don't add providers beyond OpenAI/Anthropic/Gemini — backend only supports these three
- Don't create types that diverge from backend schemas — `lib/types.ts` is the single source of truth for the frontend
- Don't use `localStorage` for API state — all state is fetched fresh from backend on page load
- Don't use `npm` or `npx` — this project uses pnpm (e.g., `pnpm dlx shadcn add <component>`, not `npx shadcn add`)
- Don't use relative imports — always use `@/` path alias
