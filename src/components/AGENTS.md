# FRONTEND COMPONENTS KNOWLEDGE BASE

## OVERVIEW
`src/components/` holds Prism's shared shell chrome and reusable UI. Keep it presentation-first, with navigation config, app layout, and small cross-route widgets here. Anything that fetches data, owns realtime state, or depends on route-specific query logic belongs elsewhere. The current statistics page only reuses a small shared rendering subset from this package.

## STRUCTURE
```
components/
├── layout/                   # AppLayout shell and app-layout helpers
├── layout/app-layout/AGENTS.md # Dense shell-state cluster under the layout shell
├── loadbalance/              # Shared loadbalance badges, table, detail sheet
├── statistics/               # Shared statistics cards and request-event displays
├── ui/                       # shadcn/ui primitives and local wrappers
├── PageHeader.tsx
├── MetricCard.tsx
├── StatusBadge.tsx
├── WebSocketStatusIndicator.tsx
├── ApiFamilyIcon.tsx / ApiFamilySelect.tsx / VendorSelect.tsx
└── ThemeToggle.tsx / LanguageSwitcher.tsx / GlobalPreferencesControls.tsx / CopyButton.tsx / EmptyState.tsx / SwitchController.tsx / AnimatedListItem.tsx
```

## WHERE TO LOOK

- Shell handoff and layout chrome: `layout/AppLayout.tsx`
- App-layout helper cluster, including shell state, profile UX, and dialog flow: `layout/app-layout/AGENTS.md`
- Sidebar links, profile-scoped prefixes, profile cap, version label: `layout/app-layout/navigationProfileConfig.ts`
- Realtime status and small cross-route widgets: `WebSocketStatusIndicator.tsx`, `PageHeader.tsx`, `MetricCard.tsx`, `StatusBadge.tsx`, `ApiFamilyIcon.tsx`, `ApiFamilySelect.tsx`, `VendorSelect.tsx`, `VendorIcon.tsx`, `vendorIconRegistry.tsx`
- Shared loadbalance rendering: `loadbalance/LoadbalanceBadges.tsx`, `loadbalance/LoadbalanceEventsTable.tsx`, `loadbalance/LoadbalanceEventDetailSheet.tsx`
- Shared statistics rendering: `statistics/TopSpendingCard.tsx`, `statistics/TokenMetricCell.tsx`
- Design-system wrappers: `ui/`, especially `ui/chart.tsx`, `ui/topography.tsx`, `ui/sonner.tsx`

## CHILD DOCS

- `layout/app-layout/AGENTS.md`: sidebar, header, profile-switcher, dialog, and visible-version ownership beneath `AppLayout.tsx`.

## CONVENTIONS

- Keep shared components presentation-focused. Data fetching, transport, and route state stay in pages, hooks, and `src/lib/`.
- Keep shell copy and navigation rules in `layout/app-layout/navigationProfileConfig.ts`.
- Let `layout/app-layout/AGENTS.md` own the dense shell helper cluster instead of expanding this parent with leaf-level detail.
- Reuse `ui/` primitives before adding one-off markup.
- Keep locale-sensitive shell controls wired through `src/i18n/` instead of hard-coded labels.
- Keep loadbalance and statistics components fed by shaped props, not their own API calls.
- Keep vendor icon rendering on the shared `VendorIcon.tsx` plus the local vendored registry, and fall back to a monogram or placeholder when icon data is missing or unknown.

## ANTI-PATTERNS

- Do not move page-specific orchestration into shared components.
- Do not duplicate navigation constants or profile-switcher behavior outside `layout/app-layout/` and its child AGENTS map.
- Do not bypass `ui/` wrappers when they already provide spacing, variants, or accessibility.
- Do not let loadbalance or statistics widgets become route-specific dumping grounds.
