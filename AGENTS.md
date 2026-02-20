# FRONTEND KNOWLEDGE BASE

## OVERVIEW

React 19 SPA dashboard for managing LLM proxy configuration — models, endpoints, health, request statistics, audit logs, and settings. Built with Vite 7, TypeScript 5.9, TailwindCSS 4, and shadcn/ui.

## STRUCTURE

```
src/
├── main.tsx                    # Entry: ThemeProvider + TooltipProvider + Toaster + App
├── App.tsx                     # BrowserRouter with 6 routes inside AppLayout
├── pages/
│   ├── DashboardPage.tsx       # Overview of all models with health badges
│   ├── ModelsPage.tsx          # Model CRUD list (442 lines)
│   ├── ModelDetailPage.tsx     # Single model: endpoints, health checks, config (591 lines)
│   ├── StatisticsPage.tsx      # Request logs + aggregated stats (312 lines)
│   ├── AuditPage.tsx           # Audit log viewer with detail modal (364 lines)
│   └── SettingsPage.tsx        # Provider audit toggles + config export/import (336 lines)
├── components/
│   ├── layout/AppLayout.tsx    # Responsive sidebar nav (collapsible on mobile) + Outlet
│   ├── ProviderIcon.tsx        # SVG brand icons for OpenAI, Anthropic, Gemini
│   ├── ThemeToggle.tsx         # Dark/light mode toggle (next-themes)
│   └── ui/                     # shadcn/ui primitives (15 components)
├── lib/
│   ├── api.ts                  # Typed fetch wrapper — all backend API calls (6 namespaces)
│   ├── types.ts                # TypeScript interfaces mirroring backend schemas (295 lines)
│   └── utils.ts                # cn() helper (clsx + tailwind-merge)
└── assets/                     # Static assets
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add API call | `lib/api.ts` | Add to `api` object, use `request<T>()` helper |
| Add/change types | `lib/types.ts` | Must match backend Pydantic schemas exactly |
| Add page | `App.tsx` (route) + `pages/` (component) + `AppLayout` (nav link) |
| Add UI component | `npx shadcn add <name>` | Installs to `components/ui/` |
| Change API base URL | `VITE_API_BASE` env var | Default: `http://localhost:8000` |
| Theming | `index.css` + `next-themes` | CSS variables for light/dark |
| Audit UI | `pages/AuditPage.tsx` | Log list + detail modal with request/response bodies |
| Provider settings | `pages/SettingsPage.tsx` | Audit toggles + config export/import |

## CONVENTIONS

- Import paths use `@/` alias (resolves to `src/`)
- All API calls go through `lib/api.ts` — never use raw `fetch()` in components
- Types in `lib/types.ts` use `snake_case` field names to match backend JSON responses
- Forms use `react-hook-form` + `zod` for validation
- Toast notifications via `sonner`
- Icons from `lucide-react`; provider brand icons via `components/ProviderIcon.tsx`
- Responsive layout: collapsible sidebar drawer on mobile, fixed on lg+
- No test framework configured — lint only (`npm run lint`)

## ANTI-PATTERNS

- Don't add providers beyond OpenAI/Anthropic/Gemini — backend only supports these three
- Don't create types that diverge from backend schemas — `lib/types.ts` is the single source of truth for the frontend
- Don't use `localStorage` for API state — all state is fetched fresh from backend on page load
