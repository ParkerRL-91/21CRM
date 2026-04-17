---
title: "Pipeline Change Newsfeed (What Changed This Week)"
id: TASK-103
project: PRJ-005
status: backlog
priority: P0
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #pipeline, #analytics, #ux, #newsfeed]
---

# TASK-103: Pipeline Change Newsfeed ("What Changed This Week")

## User Stories

- As **Dana (VP RevOps)**, I want a newsfeed that summarizes what changed in the pipeline this week (deals added, lost, stage-changed, amount-changed, slipped) so I can walk into Monday's forecast call already knowing the story.
- As **Morgan (Sales Manager)**, I want to see which of my team's deals moved forward, went backward, or stalled this week so I can spend coaching time on the right opportunities without reviewing every deal individually.
- As **Alex (Sales Rep)**, I want to see a timeline of changes on my deals so I can verify my pipeline is accurately reflected and nothing was missed during sync.
- As **Casey (Finance/Controller)**, I want to see closed-won deal activity for the week so I can reconcile expected bookings with what actually closed.

## Outcomes

1. A "Pipeline Changes" component on the dashboard/pipeline page showing a chronological feed of deal changes
2. Change categories: **New Deals** (entered pipeline), **Deals Won** (moved to closed-won), **Deals Lost** (moved to closed-lost), **Stage Changes** (forward or backward movement), **Amount Changes** (increased/decreased), **Close Date Changes** (pushed or pulled)
3. Each feed item shows: deal name, change type, old value → new value, when it happened, deal owner
4. Time-range filter: this week, last 7 days, last 14 days, last 30 days, custom range
5. Aggregated summary header: "This week: +$X new pipeline, -$Y lost, $Z moved forward, $W slipped"
6. Feed items are clickable (links to deal detail or filtered pipeline view)

## Success Metrics

- [ ] Newsfeed renders within 1 second for up to 500 changes
- [ ] All 6 change categories are detected and displayed with appropriate icons/colors
- [ ] Summary header shows aggregate dollar amounts for the selected period
- [ ] Time-range filter works (7d, 14d, 30d, custom)
- [ ] Each feed item shows deal name, change details (old → new), timestamp, and owner
- [ ] Feed items are clickable and navigate to relevant context
- [ ] Data sourced entirely from local tables (deal_stage_history, property_change_log) — no HubSpot API calls
- [ ] Unit tests cover change detection logic for all 6 categories

## Implementation Plan

1. Create `src/lib/pipeline/change-feed.ts` with change detection logic:
   - `detectPipelineChanges(stageHistory, changeLog, dateRange)` — returns typed change events
   - `aggregateChanges(changes)` — summary stats (total added, lost, moved, slipped, amounts)
   - Change event types with union discriminator for type safety
2. Create `src/app/api/pipeline/changes/route.ts` API endpoint:
   - GET with query params: `from`, `to`, `owner`, `limit`
   - Queries deal_stage_history and property_change_log with date range filters
   - Returns typed change events with deal details resolved from crm_objects
3. Create newsfeed UI components:
   - `ChangesFeedSummary` — aggregate header with dollar amounts
   - `ChangesFeedList` — scrollable feed of individual change items
   - `ChangesFeedItem` — single change event with icon, description, and link
4. Integrate into pipeline page as a collapsible panel or tab
5. Add to the main dashboard page as a widget

## Files to Change

- `src/lib/pipeline/change-feed.ts` — NEW: change detection and aggregation engine
- `src/lib/pipeline/change-feed.test.ts` — NEW: unit tests for change detection logic
- `src/lib/pipeline/change-types.ts` — NEW: TypeScript types for change events
- `src/app/api/pipeline/changes/route.ts` — NEW: API endpoint for pipeline changes
- `src/components/pipeline/changes-feed-summary.tsx` — NEW: aggregate summary header
- `src/components/pipeline/changes-feed-list.tsx` — NEW: scrollable change feed
- `src/components/pipeline/changes-feed-item.tsx` — NEW: individual change event component
- `src/app/(dashboard)/pipeline/page.tsx` — add changes panel/tab to pipeline page
- `src/app/(dashboard)/dashboards/page.tsx` — add changes widget to main dashboard

## Tests to Write

- `src/lib/pipeline/change-feed.test.ts`:
  - Detects new deals added to pipeline within date range
  - Detects deals moved to closed-won (Deals Won)
  - Detects deals moved to closed-lost (Deals Lost)
  - Detects forward and backward stage changes
  - Detects amount increases and decreases
  - Detects close date changes (pushed and pulled)
  - Aggregation: correct totals for dollar amounts across change types
  - Date range filtering: only includes changes within the specified range
  - Empty results: returns empty feed when no changes in range
  - Sorting: changes returned in reverse chronological order

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #2 (Deal Risk & Pipeline Health). Depends on data from deal_stage_history and property_change_log populated by sync engine.

## Takeaways

_To be filled during execution_
