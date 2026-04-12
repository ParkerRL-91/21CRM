---
title: "Products Page: Display Friendly Billing Period Names"
id: TASK-026
project: PRJ-001
status: done
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #products, #ux, #bug]
---

# TASK-026: Products Billing Period Display Names

## User Stories

- As a user, I want the products page to show "Annual" instead of "P12M", "Monthly" instead of "P1M", and "Quarterly" instead of "P3M" so the billing period is human-readable.

## Outcomes

1. Products page displays friendly billing period labels:
   - `P12M` → "Annual"
   - `P1M` → "Monthly"
   - `P3M` → "Quarterly"
   - `P6M` → "Semi-Annual"
   - null/empty → "One-Time"
2. Applied wherever billing period is shown (cards, tables, filters)

## Success Metrics

- [ ] All ISO 8601 billing periods show friendly names
- [ ] One-time products clearly labeled
- [ ] Consistent across all product display locations

## Implementation Plan

1. Create a `formatBillingPeriod(period: string | null)` utility (can live alongside `parseBillingPeriodMonths` in rev-rec engine or a shared utils file)
2. Apply to products page card/table rendering
3. Apply to subscriptions page if billing period is shown there

## Files to Change

- `src/app/(dashboard)/products/page.tsx` — use friendly labels
- `src/lib/rev-rec/engine.ts` or `src/lib/format.ts` — add `formatBillingPeriod()` utility

## Status Log

- 2026-03-22: Created. Products page shows raw ISO 8601 period codes.

## Takeaways

_To be filled during execution_
