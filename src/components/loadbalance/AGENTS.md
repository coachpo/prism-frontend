# FRONTEND LOADBALANCE COMPONENTS KNOWLEDGE BASE

## OVERVIEW
`loadbalance/` holds shared renderers for loadbalance badges, event rows, and the event detail sheet.

## WHERE TO LOOK
- `LoadbalanceBadges.tsx`
- `LoadbalanceEventDetailSheet.tsx`
- `LoadbalanceEventsTable.tsx`
- `__tests__/`

## CONVENTIONS
- Keep these components presentational and feed them shaped props.
- Keep route-specific data loading out of this folder.

## ANTI-PATTERNS
- Do not move route-state or realtime orchestration into this shared folder.
- Do not duplicate page-local event formatting when the shared detail sheet or table already owns the presentation.
