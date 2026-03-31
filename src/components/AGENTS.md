# FRONTEND COMPONENTS KNOWLEDGE BASE

## OVERVIEW
`src/components/` holds Prism's shared shell chrome and reusable UI. The dense shell-state cluster lives under `layout/app-layout/`, while this parent owns the direct shared widgets that multiple routes or shell surfaces reuse.

## STRUCTURE
```text
components/
├── GlobalPreferencesControls.tsx                     # Shared language/theme control row for auth and shell surfaces
├── WebSocketStatusIndicator.tsx                      # Shared realtime connection badge
├── VendorIcon.tsx + VendorSelect.tsx + vendorIcon*.tsx # Shared vendor icon and picker helpers
├── layout/app-layout/AGENTS.md                       # Dense shell-state cluster behind AppLayout
├── loadbalance/AGENTS.md                             # Shared loadbalance renderers and tests
├── statistics/AGENTS.md                              # Shared statistics renderers
└── ui/                                               # shadcn/ui primitives and wrappers
```

## WHERE TO LOOK
- Shell chrome and layout handoff: `layout/AppLayout.tsx`
- Shell state cluster, nav/version ownership, and profile-switcher behavior: `layout/app-layout/AGENTS.md`
- Shared language/theme controls: `GlobalPreferencesControls.tsx`, `LanguageSwitcher.tsx`, `ThemeToggle.tsx`
- Shared realtime connection badge: `WebSocketStatusIndicator.tsx`
- Shared vendor icon and picker surfaces: `VendorIcon.tsx`, `VendorSelect.tsx`, `vendorIconRegistry.tsx`, `vendorIconComponents.tsx`
- Shared loadbalance rendering: `loadbalance/LoadbalanceBadges.tsx`, `loadbalance/LoadbalanceEventsTable.tsx`, `loadbalance/LoadbalanceEventDetailSheet.tsx`, `loadbalance/__tests__/`
- Shared statistics rendering: `statistics/TopSpendingCard.tsx`, `statistics/TokenMetricCell.tsx`
- Design-system wrappers: `ui/`

## CHILD DOCS
- `layout/app-layout/AGENTS.md`: shell chrome, profile switcher, profile dialogs, and visible version-label ownership.
- `loadbalance/AGENTS.md`: shared loadbalance badges, table, event detail sheet, and tests.
- `statistics/AGENTS.md`: shared statistics cards and token metric cells.

## CONVENTIONS
- Keep shared components presentation-first.
- Keep data fetching and route state out of this tree.
- Keep shell-state ownership in `layout/app-layout/`; the direct components here should stay compositional or presentational.
- Keep locale and theme controls in the shared preference widgets instead of duplicating them in auth pages or shell headers.
- Keep shared websocket-health presentation in `WebSocketStatusIndicator.tsx` rather than rebuilding connection badges in pages.
- Reuse `ui/` primitives before adding one-off markup.
- When doing upgrade work, backward compatibility with the pre-upgrade implementation is not a goal unless explicitly requested. Do not add compatibility shims, dual paths, or fallback behavior solely to preserve the old interface.

## ANTI-PATTERNS
- Do not move nav-link, profile-dialog, or version-label logic out of `layout/app-layout/`.
- Do not put page-specific fetches or route-state parsing in shared components.
- Do not duplicate vendor icon fallback logic or websocket-health badges across route folders.
