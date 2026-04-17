---
title: "Pipeline Movement View (Weekly Adds/Losses/Stage Changes)"
id: TASK-106
project: PRJ-005
status: backlog
priority: P1
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #pipeline, #analytics, #ux, #movement]
---

# TASK-106: Pipeline Movement View (Weekly Adds/Losses/Stage Changes)

## User Stories

- As **Dana (VP RevOps)**, I want a pipeline movement view showing how much pipeline was added, lost, and moved between stages week-over-week so I can identify pipeline generation problems before they become revenue misses.
- As **Morgan (Sales Manager)**, I want to see which deals moved forward and which moved backward this week, broken down by rep, so I can focus coaching on reps with backward movement and celebrate forward progress.
- As **Alex (Sales Rep)**, I want to see my own pipeline movement so I can self-assess whether I'm progressing deals or letting them stagnate.
- As **Casey (Finance/Controller)**, I want to see net pipeline change by period (adds minus losses) so I can validate that the sales team's pipeline generation supports our revenue forecast.

## Outcomes

1. A pipeline movement view (section or tab on pipeline page) showing:
   - **Pipeline Added**: new deals entering the pipeline in the period (count + value)
   - **Pipeline Lost**: deals moved to closed-lost or removed (count + value)
   - **Stage Advances**: deals that moved forward in the pipeline (count + value)
   - **Stage Regressions**: deals that moved backward in the pipeline (count + value)
   - **Net Pipeline Change**: added - lost for the period
2. Visual: horizontal waterfall/bar chart showing the flow (opening → adds → advances → regressions → losses → closing)
3. Breakdown by rep and by pipeline stage
4. Period selector: this week, last week, this month, last 30 days, custom
5. Trend view: pipeline movement over multiple weeks to spot patterns

## Success Metrics

- [ ] Pipeline added/lost correctly calculated from deal_stage_history entries within date range
- [ ] Stage advances and regressions distinguished by comparing pipeline stage order
- [ ] Net pipeline change equals opening balance + adds - losses (with stage moves accounted for)
- [ ] Rep breakdown shows pipeline movement per sales rep
- [ ] Period selector works for weekly, monthly, and custom date ranges
- [ ] Trend view shows multiple weeks side by side
- [ ] Loads within 2 seconds for 1,000+ deals and 5,000+ history entries
- [ ] Unit tests verify movement calculations for all scenarios

## Implementation Plan

1. Create `src/lib/pipeline/movement-engine.ts`:
   - `computePipelineMovement(stageHistory, stageOrder, dateRange)` — categorize all movements
   - `categorizeDealMovement(deal, historyEntries, stageOrder)` — classify as add/loss/advance/regress
   - `aggregateMovementByRep(movements)` — group by deal owner
   - `aggregateMovementByStage(movements)` — group by source/destination stage
   - `computeMovementTrend(stageHistory, stageOrder, periods)` — multi-period trend
   - Stage order resolved from `app_config["hubspot_pipelines"]` stage displayOrder
2. Create `src/app/api/pipeline/movement/route.ts`:
   - GET: returns pipeline movement data for a date range
   - Query params: from, to, ownerId (optional filter)
   - Queries deal_stage_history with date range, resolves deal details from crm_objects
3. Create movement visualization components:
   - `PipelineMovementChart` — waterfall showing opening → adds → movement → losses → closing
   - `PipelineMovementTable` — tabular breakdown by rep and stage
   - `PipelineMovementTrend` — multi-period trend chart
4. Integrate into pipeline page as a new "Movement" tab

## Files to Change

- `src/lib/pipeline/movement-engine.ts` — NEW: pipeline movement computation engine
- `src/lib/pipeline/movement-engine.test.ts` — NEW: unit tests for movement calculations
- `src/lib/pipeline/movement-types.ts` — NEW: TypeScript types for movement categories and aggregations
- `src/app/api/pipeline/movement/route.ts` — NEW: API endpoint for movement data
- `src/app/(dashboard)/pipeline/page.tsx` — add Movement tab with movement chart and breakdown
- `src/components/pipeline/movement-chart.tsx` — NEW: waterfall chart for pipeline movement
- `src/components/pipeline/movement-table.tsx` — NEW: tabular breakdown by rep/stage
- `src/components/pipeline/movement-trend.tsx` — NEW: multi-period trend chart

## Tests to Write

- `src/lib/pipeline/movement-engine.test.ts`:
  - Detects new deals added (first stage history entry within date range)
  - Detects deals lost (moved to closed-lost within date range)
  - Correctly classifies forward movement (lower stage → higher stage)
  - Correctly classifies backward movement (higher stage → lower stage)
  - Net change calculation: opening + adds - losses = closing (accounting for moves)
  - Rep aggregation: correctly groups movements by deal owner
  - Stage aggregation: correctly groups by source and destination stage
  - Multi-period trend: produces accurate movement data for each period
  - Edge cases: deal with multiple stage changes in same period, deal added and lost in same period
  - Empty period: returns zero movement when no changes in range

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #2 (Deal Risk & Pipeline Health). Extends TASK-005 with rep breakdown, trend view, and richer movement categorization.

## Takeaways

_To be filled during execution_
