# Prism Frontend

**React 19 dashboard for managing LLM proxy configuration with real-time telemetry and audit logging.**

This is the frontend component of Prism, providing a web-based UI for configuring providers, models, endpoints, and viewing request statistics.

---

## Architecture

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 4
- **UI Components**: shadcn/ui
- **Icons**: lucide-react
- **Routing**: React Router v6
- **Notifications**: sonner (toast)
- **Theme**: next-themes (dark/light mode)

---

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Router + routes
│   ├── pages/
│   │   ├── DashboardPage.tsx       # Overview with model health badges
│   │   ├── ModelsPage.tsx          # Model CRUD list
│   │   ├── ModelDetailPage.tsx     # Single model + endpoints
│   │   ├── StatisticsPage.tsx      # Request logs + aggregated stats
│   │   ├── AuditPage.tsx           # Audit log viewer
│   │   └── SettingsPage.tsx        # Provider settings + config export/import
│   ├── components/
│   │   ├── layout/AppLayout.tsx    # Responsive sidebar nav
│   │   ├── ProviderIcon.tsx        # SVG brand icons (OpenAI, Anthropic, Gemini)
│   │   ├── ThemeToggle.tsx         # Dark/light mode toggle
│   │   └── ui/                     # shadcn/ui primitives
│   ├── lib/
│   │   ├── api.ts                  # Typed fetch wrapper for backend API
│   │   ├── types.ts                # TypeScript interfaces (mirrors backend schemas)
│   │   └── utils.ts                # cn() helper (clsx + tailwind-merge)
│   └── hooks/
│       └── useEndpointNavigation.ts # Navigate to model detail with endpoint focus
├── public/                         # Static assets
├── index.html                      # HTML template
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # TailwindCSS configuration
├── tsconfig.json                   # TypeScript configuration
├── components.json                 # shadcn/ui configuration
└── AGENTS.md                       # Frontend knowledge base
```

---

## Setup

### Prerequisites
- Node.js 18+
- pnpm 10.30.1

### Installation

```bash
# Enable pinned pnpm version
corepack enable
corepack prepare pnpm@10.30.1 --activate

# Install dependencies
pnpm install
```

### Running

```bash
# Development server with HMR
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Lint
pnpm run lint
```

The dev server will be available at http://localhost:5173.

---

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
# Optional backend API URL override (default: same-origin)
# VITE_API_BASE=https://your-prism-domain.example
```

### API Base URL

The frontend uses `VITE_API_BASE` when set. If unset, it uses same-origin API paths (`/api`, `/v1`, `/v1beta`). In development, Vite proxies these paths to `http://localhost:8000` by default.

---

## Key Features

### Pages

1. **Dashboard** - Overview of all models with success rate badges
2. **Models** - CRUD interface for models (native + proxy), load balancing strategies (single/failover), failover recovery controls
3. **Model Detail** - Endpoint management, health checks, success rate tracking
4. **Statistics** - Request logs with filters, aggregated stats (latency, tokens, success rate)
5. **Audit** - Audit log viewer with request/response body inspection
6. **Settings** - Provider audit toggles, config export/import

### Components

- **AppLayout** - Responsive sidebar navigation (collapsible on mobile)
- **ProviderIcon** - SVG brand icons for OpenAI, Anthropic, Gemini
- **ThemeToggle** - Dark/light mode switcher
- **Badge** - Semantic color-coded badges:
  - Type: Native (teal), Proxy (violet)
  - Status: Enabled (green), Disabled (gray)
  - HTTP Status: 2xx (green), 4xx (amber), 5xx (red)
  - Success Rate: ≥98% (green), 75-98% (yellow), <75% (red), N/A (gray)
  - Load Balancing: Single (blue), Failover (purple)
  - Recovery: Enabled (green), Disabled (gray)

### API Client

All backend API calls go through `lib/api.ts`, which provides:
- Typed request/response interfaces
- Automatic error handling
- Base URL configuration
- Namespaced API methods (providers, models, endpoints, stats, audit, config)

---

## Development Notes

### Import Paths

Use the `@/` alias for imports (resolves to `src/`):

```typescript
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
```

### Adding UI Components

Use shadcn/ui CLI to add components:

```bash
pnpm dlx shadcn add button
pnpm dlx shadcn add dialog
pnpm dlx shadcn add table
```

Components are installed to `src/components/ui/`.

### Type Safety

TypeScript types in `lib/types.ts` must match backend Pydantic schemas exactly. Use `snake_case` for field names to match JSON responses.

### Styling

- TailwindCSS 4 with CSS variables for theming
- Dark/light mode via `next-themes`
- Color palette defined in `index.css`

---

## Building for Production

```bash
# Build
pnpm run build

# Output is in dist/
# Serve with any static file server
```

The build output is optimized and minified. Serve the `dist/` directory with any static file server (nginx, Apache, Caddy, etc.).

---

## Troubleshooting

### API Connection Errors

Check that:
1. Backend is running at the URL specified in `VITE_API_BASE`
2. If `VITE_API_BASE` is unset, ensure the app is behind a reverse proxy (production) or Vite dev proxy (development)
3. CORS is enabled on the backend (it is by default)
4. No firewall blocking the connection

### Build Errors

Clear the cache and rebuild:

```bash
rm -rf node_modules dist
pnpm install
pnpm run build
```

### Type Errors

Ensure `lib/types.ts` matches the backend schemas. Run `pnpm run build` to catch type errors.

---

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](../LICENSE) for details.
