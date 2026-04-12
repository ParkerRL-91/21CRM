---
title: "Projected Rev-Rec (Closed + Weighted Pipeline Toggle)"
id: TASK-001
project: PRJ-001
status: done
priority: P0
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #rev-rec, #pipeline]
---

# TASK-001: Projected Rev-Rec (Closed + Weighted Pipeline Toggle)

## User Stories

- As a revenue leader, I want to see rev-rec schedules for both closed deals AND projected pipeline deals so that I can understand my total revenue picture, not just what's already closed.
- As a finance user, I want to toggle between "Closed Only" (actuals) and "Closed + Projected" (weighted) views so I can compare conservative vs optimistic revenue projections.
- As a VP Sales, I want projected rev-rec to weight pipeline deals by stage probability so that early-stage deals don't inflate projections unrealistically.

## Outcomes

"Done" means:
1. The rev-rec page has a toggle/tab switcher: **Closed** | **Projected (Closed + Weighted)**
2. "Closed" view shows only schedules from closed-won deals (current behavior)
3. "Projected" view shows closed-won schedules PLUS schedules computed from open pipeline deals, weighted by `hs_deal_stage_probability`
4. Projected deal schedules are visually distinguished (different color, opacity, or badge)
5. Summary stats update when toggling between views
6. Monthly waterfall updates to show projected revenue separately
7. The generate route accepts a `mode` parameter: `closed` or `projected`

## Success Metrics

- [ ] Toggle switches between closed and projected views without page reload
- [ ] Projected schedules use deal amount × stage probability for the weighted amount
- [ ] Deals with no probability or 0% probability are excluded from projected view
- [ ] Monthly waterfall shows projected revenue as a separate color/bar alongside closed
- [ ] Stats card "Total Booked" in projected mode shows closed + weighted projected
- [ ] Tests pass for weighted amount calculation
- [ ] Zero type errors

## Implementation Plan

### 1. Update the generate route (`src/app/api/rev-rec/generate/route.ts`)

- Accept a `mode` query param or body field: `"closed"` (default) | `"projected"`
- In projected mode:
  - Also query open deals (NOT closed-won) from `crm_objects`
  - For each open deal, compute `weightedAmount = amount × (hs_deal_stage_probability / 100)`
  - Use the deal's `closedate` as start date (projected close)
  - Fetch line items for open deals too (same association logic)
  - For each line item on an open deal, weight the amount by the deal's probability
  - Store in `rev_rec_schedules` with `status = 'projected'` (vs `'active'` for closed)
- On re-generate, clear projected schedules before re-computing (closed schedules remain)

### 2. Update the rev-rec schema (`src/lib/db/rev-rec-schema.ts`)

- Add a `source` column: `'closed'` | `'projected'` — distinguishes schedule origin
- Or reuse `status` field: `active` = closed-won, `projected` = weighted pipeline

### 3. Update the schedules route (`src/app/api/rev-rec/schedules/route.ts`)

- Accept a `mode` query param: `"closed"` | `"projected"` | `"all"`
- `closed`: only `status = 'active'` schedules
- `projected`: only `status = 'projected'` schedules
- `all`: both, with a `source` field on each so the UI can distinguish
- Stats should be computed separately for closed vs projected

### 4. Update the rev-rec page (`src/app/(dashboard)/rev-rec/page.tsx`)

- Add a toggle/tab control at the top: **Closed** | **Projected**
- When "Projected" is selected, fetch with `mode=all` and show both
- Projected schedules rendered with a distinct visual treatment (lighter color, dashed border, or "Projected" badge)
- Stats cards show combined totals with a breakdown (e.g., "$500K closed + $200K projected")
- Monthly waterfall shows two series: closed (solid) and projected (lighter/dashed)
- "Generate Schedules" button generates both modes

### 5. Add weighted amount calculation to engine

- New helper: `computeWeightedAmount(amount: number, probability: number): number`
- Simple: `amount * (probability / 100)`
- Used by the generate route for projected deals

### 6. Tests

- `parseBillingPeriodMonths` — already covered
- `computeWeightedAmount(100000, 50)` → 50000
- `computeWeightedAmount(100000, 0)` → 0 (excluded)
- `computeWeightedAmount(100000, 100)` → 100000

## Files to Change

- `src/app/api/rev-rec/generate/route.ts` — add projected mode, weight calculation
- `src/app/api/rev-rec/schedules/route.ts` — add mode filter, separate stats
- `src/app/(dashboard)/rev-rec/page.tsx` — toggle UI, projected visual treatment
- `src/lib/rev-rec/engine.ts` — add `computeWeightedAmount` helper
- `src/lib/rev-rec/engine.test.ts` — add weighted amount tests
- `src/lib/db/rev-rec-schema.ts` — possibly add `source` column (evaluate if `status` field suffices)

## Status Log

- 2026-03-22: Created as part of PRJ-001

## Takeaways

_To be filled during execution_
