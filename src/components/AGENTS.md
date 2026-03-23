# FRONTEND COMPONENTS KNOWLEDGE BASE

## OVERVIEW
`src/components/` holds shared presentation boundaries for the Prism shell and reusable UI: app layout chrome, profile-switcher UX, loadbalance widgets, statistics cards, shadcn wrappers, and small cross-route utility components.

## STRUCTURE
```
components/
├── AGENTS.md                            # This file: shared UI boundaries
├── layout/                              # AppLayout shell plus app-layout/ profile UX package
├── loadbalance/                         # Shared loadbalance badges, table, and detail sheet
├── statistics/                          # Statistics-only summary cards and token displays
├── ui/                                  # shadcn/ui primitives and local wrappers
├── PageHeader.tsx                       # Standard route header chrome
├── MetricCard.tsx                       # Small KPI card wrapper
├── StatusBadge.tsx                      # Semantic status badge variants
├── WebSocketStatusIndicator.tsx         # Realtime connection-state chip
├── ProviderIcon.tsx + ProviderSelect.tsx
└── ThemeToggle.tsx / CopyButton.tsx / EmptyState.tsx / SwitchController.tsx / AnimatedListItem.tsx
```

## WHERE TO LOOK

- App shell and profile-switcher package: `layout/AppLayout.tsx`, `layout/app-layout/`
- Sidebar links, profile-scoped prefixes, profile cap, and version label: `layout/app-layout/navigationProfileConfig.ts`
- Shared loadbalance rendering: `loadbalance/LoadbalanceBadges.tsx`, `loadbalance/LoadbalanceEventsTable.tsx`, `loadbalance/LoadbalanceEventDetailSheet.tsx`
- Statistics cards and token displays: `statistics/TopSpendingCard.tsx`, `statistics/SpecialTokenSummaryCard.tsx`, `statistics/SpecialTokenCoverageStrip.tsx`, `statistics/TokenMetricCell.tsx`
- Design-system boundary and wrappers: `ui/`, especially `ui/chart.tsx`, `ui/topography.tsx`, `ui/sonner.tsx`
- Reused route widgets: `PageHeader.tsx`, `MetricCard.tsx`, `StatusBadge.tsx`, `WebSocketStatusIndicator.tsx`, `ProviderIcon.tsx`, `ProviderSelect.tsx`

## CONVENTIONS

- Keep shared components presentation-focused. Data fetching, query-param state, and transport concerns stay in page folders, hooks, and `src/lib/`.
- Let `layout/app-layout/` own shell state and shell copy. `navigationProfileConfig.ts` is the source of truth for nav links, profile-scoped route prefixes, `MAX_PROFILES`, and the version label.
- Reuse `ui/` primitives before adding one-off dialog, table, badge, or card markup.
- Keep loadbalance and statistics components fed by shaped props from hooks or route helpers. They should not open their own API or realtime layers.
- Put provider branding, clipboard, empty-state, and realtime status widgets here only when multiple routes reuse them.

## ANTI-PATTERNS

- Do not move page-specific async orchestration into shared components.
- Do not duplicate profile-switcher behavior or navigation constants outside `layout/app-layout/`.
- Do not bypass existing `ui/` wrappers when they already own spacing, variants, or accessibility behavior.
- Do not let loadbalance or statistics widgets become route-specific dumping grounds. Split or move them back to the page folder when reuse disappears.
