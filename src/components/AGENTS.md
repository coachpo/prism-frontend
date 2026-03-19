# FRONTEND COMPONENTS KNOWLEDGE BASE

## OVERVIEW
`src/components/` holds shared presentation boundaries for the Prism shell and reusable UI: app layout chrome, profile-switcher UX, loadbalance widgets, statistics cards, shadcn wrappers, and small route-level utility components.

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

- App shell, navigation config, and selected-vs-active profile mismatch UX: `layout/AppLayout.tsx`, `layout/app-layout/`, `layout/app-layout/navigationProfileConfig.ts`
- Profile switcher and profile dialog state machines: `layout/app-layout/useAppLayoutState.ts`, `layout/app-layout/useProfileSwitcherState.ts`, `layout/app-layout/useProfileDialogState.ts`, `layout/app-layout/ProfileDialogs.tsx`
- Shared loadbalance event rendering: `loadbalance/LoadbalanceBadges.tsx`, `loadbalance/LoadbalanceEventsTable.tsx`, `loadbalance/LoadbalanceEventDetailSheet.tsx`
- Statistics shared cards and token displays: `statistics/TopSpendingCard.tsx`, `statistics/SpecialTokenSummaryCard.tsx`, `statistics/SpecialTokenCoverageStrip.tsx`, `statistics/TokenMetricCell.tsx`
- Design-system boundary and custom wrappers: `ui/`, especially `ui/chart.tsx`, `ui/topography.tsx`, `ui/sonner.tsx`
- Small reusable route widgets: `PageHeader.tsx`, `MetricCard.tsx`, `StatusBadge.tsx`, `WebSocketStatusIndicator.tsx`, `ProviderIcon.tsx`, `ProviderSelect.tsx`

## CONVENTIONS

- Keep shared components presentation-focused; page data fetching, query-param state, and API calls stay in page folders, hooks, and `src/lib/`.
- Let `layout/app-layout/` own profile-switcher state, conflict copy, nav config, and version-label rendering instead of recreating shell behavior in routes.
- Reuse `ui/` primitives before adding one-off dialog, table, badge, or card markup.
- Keep loadbalance and statistics components fed by shaped props from page hooks; they should not open their own fetch or websocket layers.
- Put provider branding, clipboard, empty-state, and realtime status widgets here only when multiple routes reuse them.

## ANTI-PATTERNS

- Do not move page-specific async orchestration into shared components.
- Do not duplicate profile-switcher or navigation config outside `layout/app-layout/`.
- Do not bypass existing `ui/` wrappers when they already own spacing, variants, or accessibility behavior.
- Do not let loadbalance or statistics widgets become route-specific dumping grounds; split or move them back to the page folder when reuse disappears.
