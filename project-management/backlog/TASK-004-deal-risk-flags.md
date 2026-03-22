---
title: "Deal Risk Flags (Stale, Slipped Close Date)"
id: TASK-004
project: PRJ-001
status: ready
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #pipeline, #analytics]
---

# TASK-004: Deal Risk Flags

## User Stories

- As a sales manager, I want deals automatically flagged when they've been in the same stage too long so I can intervene before they go cold.
- As a revenue leader, I want to see which deals have slipped their close date so I can pressure-test the forecast.
- As an ops user, I want a risk summary at the top of the pipeline page showing how many deals are at risk.

## Outcomes

1. Pipeline page shows risk badges on individual deals: "Stale" (no stage change in 14+ days), "Slipped" (close date moved past original), "No Close Date"
2. A risk summary card at the top: "X deals at risk" with breakdown
3. Risk flags are computed from existing data (`deal_stage_history`, `property_change_log`, `crm_objects`)

## Success Metrics

- [ ] Stale flag triggers after 14 days in same stage (configurable threshold)
- [ ] Slipped flag triggers when closedate is in the past and deal is still open
- [ ] Risk summary shows count and total value at risk
- [ ] Flags are visible in both pipeline table and kanban views
- [ ] No additional HubSpot API calls needed — uses local data only

## Implementation Plan

1. Create `computeDealRisks()` function in `src/lib/pipeline/risk-flags.ts` (new file)
2. Input: deal properties + last stage change date from history
3. Output: `{ stale: boolean, slipped: boolean, noCloseDate: boolean, daysInStage: number }`
4. Create `/api/pipeline/risks` endpoint that computes risks for all open deals
5. Update pipeline page to show risk badges and summary card

## Files to Change

- `src/lib/pipeline/risk-flags.ts` — NEW: risk computation logic
- `src/lib/pipeline/risk-flags.test.ts` — NEW: tests
- `src/app/api/pipeline/risks/route.ts` — NEW: risk API endpoint
- `src/app/(dashboard)/pipeline/page.tsx` — add risk badges and summary

## Status Log

- 2026-03-22: Created as part of PRJ-001

## Takeaways

_To be filled during execution_
