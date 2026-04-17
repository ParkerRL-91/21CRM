---
title: "Deferred Revenue Waterfall View"
id: TASK-002
project: PRJ-001
status: done
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #rev-rec, #ux]
---

# TASK-002: Deferred Revenue Waterfall View

## User Stories

- As a finance leader, I want to see a deferred revenue waterfall (opening → bookings → recognition → closing) so I can track how deferred revenue moves month to month.
- As an ops user, I want the waterfall to include projected revenue (from TASK-001) as a separate layer so I can see future deferred revenue exposure.

## Outcomes

1. Rev-rec page includes a waterfall chart showing: Opening Deferred Balance → New Bookings → Revenue Recognized → Closing Deferred Balance per month
2. Each bar segment is colored distinctly and labeled
3. Projected revenue (if TASK-001 complete) shown as a lighter/dashed overlay

## Success Metrics

- [ ] Waterfall correctly computes opening = previous month's closing
- [ ] Opening + bookings - recognized = closing (math checks out)
- [ ] Visual is a stacked/waterfall bar chart, not just a table
- [ ] Works with both closed-only and projected modes

## Implementation Plan

1. Add a `computeWaterfall()` function to `src/lib/rev-rec/engine.ts` that takes aggregated month data and produces waterfall entries with opening/closing balances
2. Add a waterfall chart component or extend existing BarChart to support waterfall rendering
3. Replace or augment the current monthly table in the rev-rec page with the waterfall visualization
4. Keep the tabular view available (toggle between chart and table)

## Files to Change

- `src/lib/rev-rec/engine.ts` — add `computeWaterfall()` function
- `src/lib/rev-rec/engine.test.ts` — test waterfall calculation
- `src/app/(dashboard)/rev-rec/page.tsx` — add waterfall chart section
- `src/components/charts/bar-chart.tsx` — possibly extend for waterfall mode

## Status Log

- 2026-03-22: Created as part of PRJ-001

## Takeaways

_To be filled during execution_
