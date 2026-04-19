# TASK-102 — Change Feed UI (ChangeFeed component)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Build a `ChangeFeed` component that displays a chronological activity log of CPQ object changes (quote edits, contract transitions, pricing updates). Renders inline in the deal sidebar.

## Acceptance Criteria
- `ChangeFeed` displays events in reverse-chronological order
- Each event shows: timestamp, actor, change type, and field diff
- Supports filtering by event type (pricing / contract / risk)
- Empty state handled gracefully
- Unit tested with mock change events

## Implementation Notes
- Component: `packages/twenty-front/src/modules/cpq/components/ChangeFeed.tsx`
- Change events sourced from Twenty's activity timeline GraphQL API
- Uses virtual scrolling for large feeds via `react-window`
