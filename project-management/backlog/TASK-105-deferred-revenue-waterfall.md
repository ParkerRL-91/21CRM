---
title: "Deferred Revenue Waterfall View"
id: TASK-105
project: PRJ-005
status: backlog
priority: P1
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #rev-rec, #finance, #waterfall, #dashboard]
---

# TASK-105: Deferred Revenue Waterfall View

## User Stories

- As **Casey (Finance/Controller)**, I want a deferred revenue waterfall that shows Opening Deferred Balance → New Bookings → Revenue Recognized → Adjustments → Closing Deferred Balance so I can reconcile our deferred revenue balance monthly and produce ASC 606 compliant reports.
- As **Dana (VP RevOps)**, I want to see the deferred revenue trend over time so I can understand our future revenue obligation and present accurate backlog metrics to the board.
- As **Morgan (Sales Manager)**, I want to see how new bookings flow into deferred revenue so I understand the revenue timeline for deals my team closed this quarter.
- As **Jordan (CRM Admin)**, I want the waterfall to auto-populate from existing rev-rec schedule data without needing to manually configure anything so it stays current after every rev-rec generation.

## Outcomes

1. A deferred revenue waterfall view on the rev-rec page showing the standard finance waterfall:
   - **Opening Deferred Balance** (start of period)
   - **+ New Bookings** (new deals booked in period)
   - **- Revenue Recognized** (recognized during period)
   - **+/- Adjustments** (amendments, cancellations, corrections)
   - **= Closing Deferred Balance** (end of period)
2. Period selector: monthly or quarterly view
3. Rolling waterfall: multiple periods side by side (e.g., Jan → Feb → Mar → Q1 total)
4. Drill-down: click any waterfall bucket to see the underlying deals/line items
5. Export capability for finance (CSV at minimum)
6. All data derived from existing `rev_rec_schedules` table and `crm_objects`

## Success Metrics

- [ ] Waterfall correctly calculates Opening Deferred → New Bookings → Recognized → Adjustments → Closing Deferred
- [ ] Closing balance of period N equals opening balance of period N+1
- [ ] Monthly and quarterly period views work correctly
- [ ] Rolling multi-period view shows 3-12 months side by side
- [ ] Each waterfall bucket is clickable and drills to underlying line items
- [ ] CSV export produces clean data suitable for finance teams
- [ ] Waterfall matches manual calculation on test data set
- [ ] Renders within 2 seconds for 12-month view with 1,000+ schedules

## Implementation Plan

1. Create `src/lib/rev-rec/waterfall-engine.ts`:
   - `computeDeferredWaterfall(schedules, periodType, dateRange)` — compute waterfall for each period
   - `computeOpeningBalance(schedules, asOfDate)` — sum of unrecognized revenue as of a date
   - `computeNewBookings(schedules, periodStart, periodEnd)` — schedules with start date in period
   - `computeRecognized(schedules, periodStart, periodEnd)` — sum of monthly_schedule amounts in period
   - `computeAdjustments(schedules, periodStart, periodEnd)` — net changes from amendments
   - Type: `WaterfallPeriod { opening, newBookings, recognized, adjustments, closing, period }`
2. Create `src/app/api/rev-rec/waterfall/route.ts`:
   - GET: compute and return waterfall data
   - Query params: periodType (month/quarter), from, to
   - Source data from rev_rec_schedules joined with crm_objects for deal metadata
3. Create waterfall chart component:
   - `DeferredRevenueWaterfall` — stacked/bridge chart showing the flow
   - Use green for additions (bookings), red for subtractions (recognized), blue for balances
   - Period-over-period horizontal layout
4. Integrate into rev-rec page as a new tab or section
5. Add CSV export button for the waterfall data

## Files to Change

- `src/lib/rev-rec/waterfall-engine.ts` — NEW: deferred revenue waterfall computation engine
- `src/lib/rev-rec/waterfall-engine.test.ts` — NEW: unit tests for waterfall calculations
- `src/lib/rev-rec/waterfall-types.ts` — NEW: TypeScript interfaces for waterfall periods and buckets
- `src/app/api/rev-rec/waterfall/route.ts` — NEW: API endpoint for waterfall data
- `src/app/(dashboard)/rev-rec/page.tsx` — add waterfall tab/section to rev-rec page
- `src/components/charts/waterfall-chart.tsx` — NEW: reusable waterfall/bridge chart component
- `src/components/rev-rec/deferred-revenue-waterfall.tsx` — NEW: waterfall page section with period selector and export

## Tests to Write

- `src/lib/rev-rec/waterfall-engine.test.ts`:
  - Opening balance: correctly sums unrecognized revenue as of period start
  - New bookings: only includes schedules starting within the period
  - Recognized: correctly sums monthly allocations within the period
  - Closing balance: equals opening + new bookings - recognized +/- adjustments
  - Continuity: closing balance of month N equals opening balance of month N+1
  - Multi-period: generates correct waterfall for 3-month and 12-month ranges
  - Quarterly rollup: aggregates monthly data into quarterly periods correctly
  - Empty periods: handles months with no new bookings or recognition
  - Edge cases: schedules spanning period boundaries, partial month recognition
  - Large dataset: processes 1,000+ schedules within performance budget

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #3 (Revenue Waterfall). This is the HubiFi signature view — critical for finance team adoption.

## Takeaways

_To be filled during execution_
