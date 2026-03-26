# Prism Frontend

React 19 management dashboard for Prism. This package owns the browser UI, the
typed frontend API boundary, profile-scoped management flows, realtime updates,
and the route shells for dashboard, models, endpoints, statistics, settings,
proxy API keys, pricing templates, and request logs.

## Frontend-only commands

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run lint
pnpm run test
```

When started through the checked-in root launcher, Prism serves the frontend at
`http://localhost:15173`. For full-stack local setup, launcher behavior, and
shared repository context, start at `../README.md` and `./AGENTS.md`.

## Runtime notes

- `VITE_API_BASE` is optional. If it is unset, the frontend uses same-origin
  requests to `/api`, `/v1`, and `/v1beta`.
- Local Vite development proxies those paths to the backend by default.
- The production container serves the built `dist/` output through
  `server.mjs`, which also exposes `/health`.

## Route and ownership map

- `src/App.tsx` mounts the public auth routes and protected shell routes.
- `src/pages/` owns route-domain shells for dashboard, models, endpoints,
  statistics, request logs, settings, pricing templates, and proxy API keys.
- `src/lib/api.ts` is the public typed API boundary.
- `src/lib/websocket.ts` owns the realtime client used by `useRealtimeData()`.
- `src/context/` owns auth bootstrap and selected-profile management scope.

For deeper implementation boundaries, use `src/pages/AGENTS.md`,
`src/lib/AGENTS.md`, `src/context/AGENTS.md`, and nearby feature docs.

## shadcn workflow

Prism still uses the checked-in shadcn registry configuration in
`components.json`, and `src/index.css` still imports `shadcn/tailwind.css`.
Keep that workflow intact when adding or updating UI primitives.

```bash
pnpm dlx shadcn add button
pnpm dlx shadcn add dialog
pnpm dlx shadcn add table
```

Generated primitives belong under `src/components/ui/`.
