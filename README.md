# Prism Frontend

**React 19 dashboard for managing LLM proxy configuration with real-time telemetry and audit logging.**

This is the frontend component of Prism, providing a web-based UI for configuring providers, models, endpoints, connections, and investigating request activity.

---

## Architecture

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 4
- **UI Components**: shadcn/ui
- **Icons**: lucide-react
- **Routing**: React Router 7
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
│   │   ├── DashboardPage.tsx       # Thin dashboard route shell
│   │   ├── ModelsPage.tsx          # Thin models route shell
│   │   ├── ModelDetailPage.tsx     # Model detail route shell
│   │   ├── EndpointsPage.tsx       # Endpoint management route shell
│   │   ├── StatisticsPage.tsx      # Analytics route shell
│   │   ├── RequestLogsPage.tsx     # Request-log investigation route shell
│   │   ├── ProxyApiKeysPage.tsx    # Proxy key route shell
│   │   ├── PricingTemplatesPage.tsx # Pricing template route shell
│   │   ├── dashboard/              # Dashboard widgets + data hook
│   │   ├── endpoints/              # Endpoint cards, dialogs, page data hook
│   │   ├── model-detail/           # Model detail orchestration, connection helpers, loadbalance events
│   │   ├── models/                 # Models dialogs, table, page data hook
│   │   ├── pricing-templates/      # Pricing dialogs, table, page data hook
│   │   ├── proxy-api-keys/         # Proxy key cards, dialogs, page data hook
│   │   ├── request-logs/           # Request-log filters, table, detail sheet, page data hook
│   │   ├── settings/               # Settings sections, dialogs, data hooks
│   │   └── statistics/             # Statistics tabs, charts, page data hooks
│   ├── components/
│   │   ├── layout/AppLayout.tsx    # Responsive sidebar nav
│   │   ├── ProviderIcon.tsx        # SVG brand icons (OpenAI, Anthropic, Gemini)
│   │   ├── ThemeToggle.tsx         # Dark/light mode toggle
│   │   └── ui/                     # shadcn/ui primitives
│   ├── lib/
│   │   ├── api.ts                  # Public typed API boundary
│   │   ├── api/                    # Split API modules (core, auth/settings, management, observability)
│   │   ├── types.ts                # TypeScript interfaces (mirrors backend schemas)
│   │   └── utils.ts                # cn() helper (clsx + tailwind-merge)
│   └── hooks/
│       ├── useConnectionNavigation.ts # Navigate to model detail with connection focus
│       ├── useRealtimeData.ts        # WebSocket-backed live refresh helper
│       └── useTimezone.ts            # Shared timezone formatting helper
├── public/                         # Static assets
├── index.html                      # HTML template
├── vite.config.ts                  # Vite configuration
├── components.json                 # shadcn registry configuration
├── tsconfig.json                   # TypeScript configuration
└── AGENTS.md                       # Frontend knowledge base
```

---

## Setup

### Prerequisites
- Node.js 24+
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

When building Docker images, pass `VITE_API_BASE` as a build arg only if you need a cross-origin backend:

```bash
docker build \
  --build-arg VITE_API_BASE=https://your-prism-domain.example \
  -t prism-frontend:latest .
```

---

## Key Features

### Pages

1. **Dashboard** - Overview of all models with success rate badges
2. **Models** - CRUD interface for models (native + proxy), load balancing strategies (single/failover), failover recovery controls
3. **Model Detail** - Connection management, health checks, success rate tracking
4. **Endpoints** - Profile-scoped credential management (Base URL + API Key)
5. **Statistics** - Aggregated latency, token, spending, and throughput views
6. **Request Logs** - Investigate routed requests, audit payload capture, and request-level detail
7. **Proxy API Keys** - Issue, rotate, and revoke runtime keys
8. **Pricing Templates** - Shared pricing configuration for connections
9. **Settings** - Provider audit toggles, auth setup, costing settings, retention, and config import/export

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
- Namespaced API methods for profiles, auth, providers, models, endpoints, connections, stats, audit, config, and pricing templates

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

This repo does not currently include a shared `CONTRIBUTING.md`; follow the frontend
route and component conventions in `AGENTS.md` and nearby feature folders.

---

## License

This repo does not currently include a standalone `LICENSE` file.
