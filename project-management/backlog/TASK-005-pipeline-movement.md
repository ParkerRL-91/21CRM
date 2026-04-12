---
title: "Pipeline Movement View (Weekly Adds/Losses/Changes)"
id: TASK-005
project: PRJ-001
status: done
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #pipeline, #analytics]
---

# TASK-005: Pipeline Movement View

## User Stories

- As a sales leader, I want to see what changed in my pipeline this week — deals added, deals lost, deals that moved forward, deals that slipped — so I can prepare for Monday's pipeline meeting.
- As an ops user, I want week-over-week pipeline movement data to identify patterns (e.g., deals always slip in week 3 of the quarter).

## Outcomes

1. Pipeline page has a "Movement" tab or section showing weekly pipeline changes
2. Four categories: Added (new deals), Won (moved to closed-won), Lost (moved to closed-lost), Moved (stage changed but still open)
3. Each category shows deal count and total value
4. Visual timeline or table showing week-over-week trends

## Success Metrics

- [ ] Movement data computed from `deal_stage_history` table (no additional API calls)
- [ ] Shows current week and at least 4 prior weeks
- [ ] Each category is expandable to show the individual deals
- [ ] Net pipeline change is prominently displayed (added - lost = net)

## Implementation Plan

1. Create `/api/pipeline/movement` endpoint that queries `deal_stage_history` and `crm_objects`
2. Group stage changes by week, categorize as added/won/lost/moved
3. Return weekly summaries with deal lists per category
4. Add movement section to pipeline page with a compact timeline visualization

## Files to Change

- `src/app/api/pipeline/movement/route.ts` — NEW: movement computation
- `src/app/(dashboard)/pipeline/page.tsx` — add movement section/tab

## Status Log

- 2026-03-22: Created as part of PRJ-001

## Takeaways

_To be filled during execution_
