# FRONTEND HOOKS KNOWLEDGE BASE

## OVERVIEW
`src/hooks/` contains shared reactive logic for realtime data, periodic polling, and UI reconciliation.

## CORE HOOKS
- `useRealtimeData.ts`: Shared WebSocket subscription hook. Uses the singleton client in `src/lib/websocket.ts`. Handles channel ref-counting and automatic cleanup.
- `usePolling.ts`: Standardized periodic refresh hook with tab-visibility awareness.
- `useCoalescedReconcile.ts`: Helper for merging high-frequency realtime updates with slower REST-based bootstrap state.
- `useTimezone.ts`: Consumes timezone settings and provides formatting helpers.

## CONVENTIONS
- Prefer `useRealtimeData()` over direct WebSocket interaction.
- Use `usePolling()` for observability pages that lack full realtime coverage.
- Keep hook side effects focused; extract complex data shaping into `src/lib/` or local page helpers.

## ANTI-PATTERNS
- Do not create ad hoc `setInterval` loops in components; use `usePolling()`.
- Do not duplicate timezone formatting logic outside `useTimezone.ts` and `src/lib/timezone.ts`.
