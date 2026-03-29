# FRONTEND STATISTICS COMPONENTS KNOWLEDGE BASE

## OVERVIEW
`statistics/` holds shared renderers for the spending card and token metric cell.

## WHERE TO LOOK
- `TopSpendingCard.tsx`
- `TokenMetricCell.tsx`

## CONVENTIONS
- Keep these components presentation-first.
- Keep statistics page orchestration and data fetching in the page layer.

## ANTI-PATTERNS
- Do not move snapshot orchestration or request-log drilldown state into these shared renderers.
- Do not duplicate page-local null-vs-zero rendering rules when the statistics page helpers already shape the inputs.
