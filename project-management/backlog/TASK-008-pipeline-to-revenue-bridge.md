---
title: "Pipeline-to-Revenue Bridge View"
id: TASK-008
project: PRJ-001
status: ready
priority: P0
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #rev-rec, #pipeline, #unique-differentiator]
---

# TASK-008: Pipeline-to-Revenue Bridge View

## User Stories

- As a CFO, I want a single view showing how pipeline converts to bookings to recognized revenue to deferred revenue so I can understand the full revenue lifecycle without switching between 4 different pages.
- As a revenue leader, I want to see the flow from open pipeline → closed-won bookings → recognized this period → still deferred, so I can explain revenue timing to the board.

## Outcomes

1. A dedicated view (tab on dashboard or standalone page) showing the revenue bridge:
   - **Pipeline** (open deals, total weighted value)
   - → **Bookings** (closed-won this period)
   - → **Recognized** (revenue recognized this period from all schedules)
   - → **Deferred** (remaining unrecognized from closed deals)
2. Each stage is clickable → drills to the underlying deals/schedules
3. Visual is a horizontal flow/sankey or waterfall chart showing the conversion
4. Filterable by time period (this month, this quarter, this year)

## Success Metrics

- [ ] Bridge shows all 4 stages with accurate numbers from local data
- [ ] Period filter works (month/quarter/year)
- [ ] Each stage is clickable to drill into deals
- [ ] Numbers reconcile: pipeline is independent; bookings feed recognized + deferred
- [ ] No competitor offers this combined view — validate uniqueness

## Implementation Plan

1. Create `/api/dashboard/revenue-bridge` endpoint that aggregates:
   - Open pipeline: sum of `amount × probability` for open deals
   - Bookings: sum of closed-won deal amounts in selected period
   - Recognized: sum from `rev_rec_schedules` where month is in selected period and `recognized = true`
   - Deferred: total booked minus total recognized
2. Build a bridge/flow visualization component
3. Add to dashboard or as a new top-level page

## Files to Change

- `src/app/api/dashboard/revenue-bridge/route.ts` — NEW: bridge data aggregation
- `src/app/(dashboard)/dashboards/page.tsx` — add bridge section, or:
- `src/app/(dashboard)/revenue-bridge/page.tsx` — NEW: standalone page
- `src/components/charts/bridge-chart.tsx` — NEW: flow/waterfall visualization
- `src/components/dashboard/sidebar.tsx` — add nav link if standalone page

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-02 (P0 unique differentiator).

## Takeaways

_To be filled during execution_
