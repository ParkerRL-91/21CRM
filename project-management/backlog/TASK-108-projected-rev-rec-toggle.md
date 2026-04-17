---
title: "Projected Rev-Rec Toggle (Closed + Weighted Pipeline)"
id: TASK-108
project: PRJ-005
status: backlog
priority: P1
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #rev-rec, #forecast, #differentiator, #pipeline]
---

# TASK-108: Projected Rev-Rec Toggle (Closed + Weighted Pipeline)

## User Stories

- As **Dana (VP RevOps)**, I want to toggle the rev-rec view between "actuals only" (closed-won deals) and "projected" (actuals + probability-weighted open pipeline) so I can show the board both the confirmed revenue picture and the expected total including pipeline.
- As **Casey (Finance/Controller)**, I want the projected rev-rec to clearly separate confirmed revenue from pipeline-weighted estimates with different visual treatments so I never mistake a projection for a booked number.
- As **Morgan (Sales Manager)**, I want to see how my team's pipeline would translate into recognized revenue over the next 6-12 months if deals close as expected so I can plan resource allocation and hiring against projected revenue.
- As **Alex (Sales Rep)**, I want to see how my open deals would contribute to revenue recognition if they close so I understand the downstream impact of my pipeline on the company's financials.

## Outcomes

1. A toggle on the rev-rec page: "Actuals" (current behavior) vs "Projected" (actuals + weighted pipeline)
2. In Projected mode:
   - Closed-won deals: recognized as-is (100% weight, actual schedule)
   - Open pipeline deals: recognized based on `amount * win_probability`, with recognition starting at expected close date
   - Win probability sourced from `hs_deal_stage_probability` or deal stage default probability
3. Visual distinction: actuals in solid color, projected pipeline in hatched/transparent/dashed overlay
4. Projected schedules are computed on-the-fly (not stored) to always reflect current pipeline state
5. Summary stats update to show: "Confirmed: $X | Projected: $Y | Combined: $Z"
6. This is 21CRM's unique differentiator — no competitor shows pipeline-weighted revenue recognition

## Success Metrics

- [ ] Toggle switch on rev-rec page between "Actuals" and "Projected" modes
- [ ] Projected mode includes closed-won deals at 100% weight
- [ ] Projected mode includes open deals weighted by stage probability
- [ ] Open deal recognition schedules use expected close date as start date
- [ ] Visual distinction between actuals (solid) and projected (overlay/hatched)
- [ ] Summary stats show Confirmed, Projected, and Combined totals
- [ ] Projected computation runs in under 2 seconds for 500 open deals
- [ ] Toggle does not require API call — computed client-side from combined data
- [ ] Unit tests verify weighted schedule computation for various deal scenarios

## Implementation Plan

1. Create `src/lib/rev-rec/projected-engine.ts`:
   - `computeProjectedSchedule(deal, winProbability)` — generate a weighted rev-rec schedule for an open deal
   - `mergeActualAndProjected(actualSchedules, projectedSchedules)` — combine into unified monthly view
   - `computeProjectedSummary(merged)` — confirmed/projected/combined totals by month
   - Uses existing `computeStraightLineSchedule()` from rev-rec engine with probability weighting
2. Update `src/app/api/rev-rec/schedules/route.ts`:
   - Add `?include=projected` query param
   - When requested, also compute projected schedules for open pipeline deals
   - Return both actual and projected data separately for client-side toggling
3. Update rev-rec page:
   - Add toggle component ("Actuals" | "Projected" | "Combined")
   - Update chart rendering to show dual-layer visualization
   - Update summary stat cards with confirmed/projected/combined
4. Reuse existing rev-rec infrastructure (parseBillingPeriodMonths, computeStraightLineSchedule)

## Files to Change

- `src/lib/rev-rec/projected-engine.ts` — NEW: projected/weighted rev-rec computation
- `src/lib/rev-rec/projected-engine.test.ts` — NEW: unit tests for projected calculations
- `src/app/api/rev-rec/schedules/route.ts` — extend to support projected schedules query
- `src/app/(dashboard)/rev-rec/page.tsx` — add toggle, dual-layer chart, updated summary stats
- `src/components/rev-rec/projected-toggle.tsx` — NEW: toggle component (Actuals/Projected/Combined)
- `src/components/rev-rec/projected-chart-overlay.tsx` — NEW: overlay layer for projected amounts

## Tests to Write

- `src/lib/rev-rec/projected-engine.test.ts`:
  - Projected schedule: open deal at 50% probability generates schedule at 50% of amount
  - Projected schedule: uses expected close date as recognition start date
  - Projected schedule: handles deals with no close date (excluded from projection)
  - Projected schedule: handles deals with no line items (uses deal-level amount)
  - Merge: actual and projected schedules combine correctly by month
  - Merge: actual schedules at 100% weight, projected at probability weight
  - Summary: confirmed/projected/combined totals computed correctly
  - Edge cases: deal at 0% probability excluded, deal at 100% treated as confirmed
  - Performance: computes 500 projected schedules within performance budget
  - Integration: correctly reuses existing computeStraightLineSchedule function

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #5 (Quote-to-Revenue Bridge). Extends TASK-001 from PRJ-001. This is 21CRM's unique differentiator — no competitor shows projected revenue recognition from open pipeline.

## Takeaways

_To be filled during execution_
