# FRONTEND COMPONENTS KNOWLEDGE BASE

## OVERVIEW
`src/components/` holds Prism's shared shell chrome and reusable UI.

## STRUCTURE
```text
components/
├── layout/
├── layout/app-layout/AGENTS.md
├── loadbalance/
├── statistics/
└── ui/
```

## WHERE TO LOOK
- Shell chrome and layout handoff: `layout/AppLayout.tsx`
- Shell state cluster: `layout/app-layout/AGENTS.md`
- Shared loadbalance rendering: `loadbalance/LoadbalanceBadges.tsx`, `loadbalance/LoadbalanceEventsTable.tsx`, `loadbalance/LoadbalanceEventDetailSheet.tsx`, `loadbalance/__tests__/`
- Shared statistics rendering: `statistics/TopSpendingCard.tsx`, `statistics/TokenMetricCell.tsx`
- Design-system wrappers: `ui/`

## CHILD DOCS
- `loadbalance/AGENTS.md`: shared loadbalance badges, table, event detail sheet, and tests.
- `statistics/AGENTS.md`: shared statistics cards and token metric cells.

## CONVENTIONS
- Keep shared components presentation-first.
- Keep data fetching and route state out of this tree.
- Reuse `ui/` primitives before adding one-off markup.
