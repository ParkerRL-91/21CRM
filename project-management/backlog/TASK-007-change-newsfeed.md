---
title: "Change Newsfeed / Activity Summary on Dashboard"
id: TASK-007
project: PRJ-001
status: ready
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #dashboard, #ux]
---

# TASK-007: Change Newsfeed / Activity Summary

## User Stories

- As a revenue leader, I want the dashboard to immediately show me "what changed since I last looked" so I don't have to hunt through charts to find what's new.
- As a sales manager, I want to see deal stage changes, slipped close dates, and new deals in a feed format so I can take action fast.

## Outcomes

1. Dashboard home page shows a "Recent Changes" or "Newsfeed" section at the top
2. Feed items pulled from `deal_stage_history`, `property_change_log`, and `crm_objects` (new records)
3. Each feed item shows: what changed, which deal/contact, when, and the impact (e.g., "$50K deal moved to Negotiation")
4. Feed is sorted by recency, shows last 7 days by default
5. Items are categorized with icons: stage change, amount change, close date change, new deal

## Success Metrics

- [ ] Newsfeed loads on dashboard with real change data from local DB
- [ ] Shows at least 4 change types: stage change, amount change, close date slip, new deal
- [ ] Each item is actionable — shows deal name, what changed, dollar impact
- [ ] Renders in under 500ms (uses indexed queries on history tables)
- [ ] Falls back gracefully if no changes exist ("All quiet — no changes in the last 7 days")

## Implementation Plan

1. Create `/api/dashboard/changes` endpoint
2. Query `deal_stage_history`, `property_change_log` for recent changes (last 7 days)
3. Join with `crm_objects` to get deal names and amounts
4. Return unified feed sorted by timestamp
5. Add a newsfeed component to the dashboard home page
6. Depends on: TASK-004 (risk flags) and TASK-005 (pipeline movement) for richer data

## Files to Change

- `src/app/api/dashboard/changes/route.ts` — NEW: changes feed endpoint
- `src/app/(dashboard)/dashboards/page.tsx` — add newsfeed section at top
- `src/components/dashboard/change-feed.tsx` — NEW: feed component

## Status Log

- 2026-03-22: Created as part of PRJ-001

## Takeaways

_To be filled during execution_
