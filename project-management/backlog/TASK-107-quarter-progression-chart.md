---
title: "Quarter Progression Chart (Running Closed-Won vs Quota)"
id: TASK-107
project: PRJ-005
status: backlog
priority: P1
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #pipeline, #forecast, #analytics, #quota, #chart]
---

# TASK-107: Quarter Progression Chart (Running Closed-Won vs Quota)

## User Stories

- As **Dana (VP RevOps)**, I want a quarter progression chart that shows cumulative closed-won revenue against our quota target with a projected trendline so I can instantly see whether we're on pace to hit the number at any point in the quarter.
- As **Morgan (Sales Manager)**, I want to see my team's progression against our team quota with per-rep contribution visible so I can identify which reps are carrying and which need support to close the gap.
- As **Alex (Sales Rep)**, I want to see my personal closed-won progression against my individual quota so I know exactly where I stand and how much I need to close in the remaining weeks.
- As **Casey (Finance/Controller)**, I want to see quarter progression with a forecast overlay (committed + best case + pipeline) so I can model revenue scenarios for the quarter-end forecast.

## Outcomes

1. A quarter progression chart showing:
   - **Cumulative closed-won** line (actual revenue closed, day by day through the quarter)
   - **Quota target** line (flat line at the quarter's quota amount, or a linear daily pace line)
   - **Projected pace** line (extrapolation from current closed-won rate to quarter end)
   - **Committed pipeline** shaded area (deals in "commit" forecast category)
   - **Best case** shaded area (deals in "best case" category)
2. Period: current quarter, previous quarter, or any selected quarter
3. Breakdown: team total, per-rep, per-pipeline
4. Quota source: from `goals` table or manual entry in settings
5. Key callouts: "X% to quota", "Y days remaining", "need $Z/day to hit target"

## Success Metrics

- [ ] Chart shows cumulative closed-won as a line progressing through the quarter
- [ ] Quota line displays from goals table (or manual override)
- [ ] Projected pace line extrapolates from current rate to quarter end
- [ ] Committed and best-case pipeline shown as shaded overlay areas
- [ ] Key metrics callout: % to quota, days remaining, daily close rate needed
- [ ] Quarter selector: current, previous, or any quarter
- [ ] Filters: team total, per-rep, per-pipeline
- [ ] Chart renders in under 1 second for a typical quarter with 200+ deals
- [ ] Handles quarters with no quota set (shows closed-won without pace calculation)

## Implementation Plan

1. Create `src/lib/pipeline/quarter-progression.ts`:
   - `computeQuarterProgression(deals, quotaTarget, quarterStart, quarterEnd)` — daily cumulative closed-won
   - `computeProjectedPace(currentClosed, daysElapsed, daysRemaining)` — linear projection
   - `computePipelineOverlay(deals, forecastCategories)` — committed/best-case amounts
   - `computeGapAnalysis(closed, quota, daysRemaining)` — % to quota, daily rate needed
2. Create `src/app/api/pipeline/quarter-progression/route.ts`:
   - GET: returns quarter progression data
   - Query params: quarter (YYYY-QN), ownerId, pipelineId
   - Queries crm_objects for closed-won deals with close dates in quarter, plus goals for quota
3. Create chart components:
   - `QuarterProgressionChart` — line chart with quota line, pace projection, pipeline overlay
   - `QuarterProgressionCallout` — key metrics card (% to quota, gap, days remaining)
4. Integrate into pipeline page and/or dashboard as a prominent chart

## Files to Change

- `src/lib/pipeline/quarter-progression.ts` — NEW: quarter progression computation engine
- `src/lib/pipeline/quarter-progression.test.ts` — NEW: unit tests
- `src/app/api/pipeline/quarter-progression/route.ts` — NEW: API endpoint
- `src/app/(dashboard)/pipeline/page.tsx` — add quarter progression chart section
- `src/app/(dashboard)/dashboards/page.tsx` — add quarter progression widget
- `src/components/charts/quarter-progression-chart.tsx` — NEW: line chart with quota/pace/overlay
- `src/components/pipeline/quarter-progression-callout.tsx` — NEW: key metrics card

## Tests to Write

- `src/lib/pipeline/quarter-progression.test.ts`:
  - Cumulative: correctly accumulates closed-won amounts by close date through the quarter
  - Quota line: correctly renders flat quota target for the quarter
  - Projected pace: linear extrapolation from current closed rate
  - Pipeline overlay: correctly separates committed vs best case forecast categories
  - Gap analysis: computes correct % to quota, daily rate needed, days remaining
  - Mid-quarter: progression correct when some days have no closes
  - Start of quarter: handles zero closed-won gracefully (100% to go)
  - End of quarter: handles full quarter data (actual vs target comparison)
  - No quota: works without a quota set (shows closed-won without pace)
  - Per-rep filter: correctly filters to a single rep's deals

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #4 (Forecast Accountability). Extends TASK-006 with projected pace, pipeline overlay, and per-rep breakdown.

## Takeaways

_To be filled during execution_
