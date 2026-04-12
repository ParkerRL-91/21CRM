---
title: "Fix Subscriptions ARR: Compute from Line Items, Not Company Annual Revenue"
id: TASK-023
project: PRJ-001
status: done
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #subscriptions, #rev-rec, #bug]
---

# TASK-023: Fix Subscriptions ARR Source

## User Stories

- As a revenue leader, I want the subscriptions page to show ARR computed from the actual recurring line items on closed-won deals, NOT the company's `annualrevenue` field (which is just how much revenue the company makes overall, unrelated to our ARR).
- As a finance user, I want ARR to reflect the sum of recurring line item amounts annualized, so it matches what we recognize as recurring revenue.

## Outcomes

1. Subscriptions page ARR numbers come from deal line items, not company `annualrevenue`
2. ARR per subscription = sum of recurring line item amounts on closed-won deals, annualized
   - Monthly line items (`P1M`): amount × 12
   - Quarterly (`P3M`): amount × 4
   - Annual (`P12M`): amount × 1
   - One-time (no billing period): excluded from ARR
3. Non-recurring line items (services, one-time) are shown separately as "Non-Recurring Revenue"
4. MRR = ARR / 12

## Success Metrics

- [ ] ARR computed from line item amounts + billing periods, not company `annualrevenue`
- [ ] Monthly, quarterly, and annual billing periods correctly annualized
- [ ] One-time/service line items excluded from ARR calculation
- [ ] MRR derived from ARR (not independently computed)
- [ ] Numbers match what you'd expect from looking at actual deal line items in HubSpot

## Implementation Plan

1. Create `/api/subscriptions/arr` endpoint that:
   - Queries closed-won deals from `crm_objects`
   - Gets associated line items (from `crm_objects` type `line_items` + HubSpot associations or rev-rec schedules)
   - For each line item, checks `hs_recurring_billing_period`:
     - `P1M` → monthly, annualize × 12
     - `P3M` → quarterly, annualize × 4
     - `P12M` or `P1Y` → annual, × 1
     - null/empty → one-time, exclude from ARR
   - Returns: total ARR, total MRR, breakdown by product/deal
2. Update subscriptions page to use this endpoint instead of company `annualrevenue`
3. Show separate cards: "ARR" (recurring only) and "Non-Recurring Revenue" (one-time)

## Files to Change

- `src/app/api/subscriptions/arr/route.ts` — NEW: ARR computation from line items
- `src/app/(dashboard)/subscriptions/page.tsx` — use new ARR endpoint, remove `annualrevenue` dependency
- `src/lib/rev-rec/engine.ts` — reuse `parseBillingPeriodMonths()` for annualization

## Status Log

- 2026-03-22: Created. Current subscriptions page incorrectly uses company `annualrevenue` field for ARR.

## Takeaways

_To be filled during execution_
