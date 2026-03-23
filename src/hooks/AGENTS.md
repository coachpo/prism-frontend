# FRONTEND HOOKS KNOWLEDGE BASE

## OVERVIEW
`src/hooks/` contains shared reactive logic for realtime data, periodic polling, and UI reconciliation.

## CORE HOOKS
- `useRealtimeData.ts`: Shared realtime subscription hook. Delegates connection, reconnect, subscription, and profile-switch behavior to `src/lib/websocket.ts`, and buffers incoming channel payloads while reconnect sync is still in progress.
- `usePolling.ts`: Standardized periodic refresh hook with tab-visibility awareness.
- `useCoalescedReconcile.ts`: Helper for merging high-frequency realtime updates with slower REST-based bootstrap state.
- `useTimezone.ts`: Consumes timezone settings and provides formatting helpers.
- `useConnectionNavigation.ts`: Resolves a connection owner through the shared API layer, caches owners per selected profile, and routes to the model detail focus URL.

## CONVENTIONS
- Prefer `useRealtimeData()` over direct WebSocket interaction.
- Use `usePolling()` for observability pages that lack full realtime coverage.
- Call `markSyncComplete()` after reconnect reconciliation finishes so buffered realtime payloads can flush in order.
- Keep hook side effects focused; extract complex data shaping into `src/lib/` or local page helpers.

## ANTI-PATTERNS
- Do not create ad hoc `setInterval` loops in components; use `usePolling()`.
- Do not duplicate reconnect buffering or websocket state handling outside `useRealtimeData.ts` and `src/lib/websocket.ts`.
- Do not duplicate timezone formatting logic outside `useTimezone.ts` and `src/lib/timezone.ts`.
