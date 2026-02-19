# FRONTEND KNOWLEDGE BASE

## OVERVIEW

React 19 SPA dashboard for managing LLM proxy configuration — models, endpoints, health, and request statistics. Built with Vite, TypeScript, TailwindCSS 4, and shadcn/ui.

## STRUCTURE

```
src/
├── main.tsx                    # Entry: ThemeProvider + App
├── App.tsx                     # BrowserRouter with 4 routes inside AppLayout
├── pages/
│   ├── DashboardPage.tsx       # Overview of all models with health badges
│   ├── ModelsPage.tsx          # Model CRUD list
│   ├── ModelDetailPage.tsx     # Single model: endpoints, health checks, config
│   └── StatisticsPage.tsx      # Request logs + aggregated stats
├── components/
│   ├── layout/AppLayout.tsx    # Sidebar nav + Outlet
│   ├── ThemeToggle.tsx         # Dark/light mode toggle (next-themes)
│   └── ui/                     # shadcn/ui primitives (15 components)
├── lib/
│   ├── api.ts                  # Typed fetch wrapper — all backend API calls
│   ├── types.ts                # TypeScript interfaces mirroring backend schemas
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

## CONVENTIONS

- Import paths use `@/` alias (resolves to `src/`)
- All API calls go through `lib/api.ts` — never use raw `fetch()` in components
- Types in `lib/types.ts` use `snake_case` field names to match backend JSON responses
- Forms use `react-hook-form` + `zod` for validation
- Toast notifications via `sonner`
- Icons from `lucide-react`
- No test framework configured — lint only (`npm run lint`)

## ANTI-PATTERNS

- Don't add providers beyond OpenAI/Anthropic/Gemini — backend only supports these three
- Don't create types that diverge from backend schemas — `lib/types.ts` is the single source of truth for the frontend
- Don't use `localStorage` for API state — all state is fetched fresh from backend on page load
