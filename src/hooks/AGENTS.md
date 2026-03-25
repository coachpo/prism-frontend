# FRONTEND HOOKS KNOWLEDGE BASE

## OVERVIEW
`src/hooks/` contains Prism's shared reactive helpers for realtime updates, periodic polling, and shared display formatting.

## CORE HOOKS
- `useRealtimeData.ts`: Shared realtime subscription hook that delegates connection, reconnect, subscription, and profile-switch behavior to `src/lib/websocket.ts`.
- `usePolling.ts`: Standard periodic refresh hook with tab-visibility awareness.
- `useCoalescedReconcile.ts`: Helper for merging high-frequency realtime updates with slower REST bootstrap state.
- `useTimezone.ts`: Shared timestamp formatting through `src/i18n/format.ts`.
- `useConnectionNavigation.ts`: Resolves connection owners through the shared API layer and routes to the model-detail focus URL.

## CONVENTIONS
- Prefer `useRealtimeData()` over direct WebSocket access.
- Use `usePolling()` for observability pages that do not have full realtime coverage.
- Keep hook side effects small, and push complex shaping into `src/lib/` or local page helpers.
- Route shared date and time display through `useTimezone.ts` or `src/i18n/format.ts`.

## ANTI-PATTERNS
- Do not create ad hoc `setInterval` loops in components.
- Do not duplicate reconnect buffering or websocket state handling outside `useRealtimeData.ts` and `src/lib/websocket.ts`.
- Do not duplicate timezone formatting logic outside `useTimezone.ts` and `src/i18n/format.ts`.
