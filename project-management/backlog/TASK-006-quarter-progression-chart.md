---
title: "Quarter Progression Chart"
id: TASK-006
project: PRJ-001
status: done
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #dashboard, #forecast]
---

# TASK-006: Quarter Progression Chart

## User Stories

- As a revenue leader, I want to see a line chart showing my running closed-won total against my quota target, updated in real time, so I know if I'm on track for the quarter.
- As a VP Sales, I want to overlay the forecast projection on the same chart so I can see where the quarter is heading, not just where it's been.

## Outcomes

1. Dashboard home page shows a line chart with three lines:
   - **Closed-Won (actual)**: Cumulative closed-won revenue by week within the quarter
   - **Quota Target**: Straight-line target trajectory (total quota / weeks in quarter)
   - **Forecast Projection**: Projected close based on weighted pipeline (if available)
2. Chart auto-detects the current fiscal quarter
3. Visual makes it immediately obvious if team is ahead/behind pace

## Success Metrics

- [ ] Chart shows at least closed-won vs quota lines
- [ ] Quarter boundaries auto-calculated (supports Jan/Apr/Jul/Oct fiscal starts)
- [ ] Forecast line shown if forecast scenarios exist
- [ ] Chart renders in under 500ms
- [ ] Works with zero data (empty state, not broken chart)

## Implementation Plan

1. Create `/api/dashboard/quarter-progression` endpoint
2. Query `crm_objects` for closed-won deals this quarter, group by week
3. Compute cumulative sum per week
4. Get quota from `goals` table (if configured) or accept as parameter
5. Optionally pull forecast projection from forecast scenarios
6. Add LineChart visualization to dashboard home page

## Files to Change

- `src/app/api/dashboard/quarter-progression/route.ts` — NEW: progression data
- `src/app/(dashboard)/dashboards/page.tsx` — add chart section
- `src/components/charts/line-chart.tsx` — may need multi-series support

## Status Log

- 2026-03-22: Created as part of PRJ-001

## Takeaways

_To be filled during execution_
