---
title: "Subscriptions: Only Show Companies with Active Subscriptions"
id: TASK-025
project: PRJ-001
status: ready
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #subscriptions, #bug]
---

# TASK-025: Filter Subscriptions to Active Only

## User Stories

- As a revenue leader, I want the subscriptions page to only show companies that currently have active subscriptions, not every company that ever had a deal.
- As an ops user, I want "active" defined as: the deal's close date + the longest line item term has not yet expired.

## Outcomes

1. Subscriptions page filters to companies where at least one deal's subscription is still active
2. Active subscription = `closedate + max(line_item.hs_term_in_months)` > today
3. Expired subscriptions excluded from the default view (but available via a "Show expired" toggle)
4. Subscription end date shown per company/deal

## Success Metrics

- [ ] Only companies with active (non-expired) subscriptions shown by default
- [ ] End date computed from close date + longest term across line items
- [ ] "Show expired" toggle reveals churned subscriptions
- [ ] Companies with no term data treated as month-to-month (close_date + 1 month)

## Implementation Plan

1. For each closed-won deal, compute subscription end date: `closedate + max(hs_term_in_months)` across associated line items
2. Filter to deals where end date > today
3. Group by company, show latest active subscription
4. Add toggle for showing expired subscriptions

## Files to Change

- `src/app/(dashboard)/subscriptions/page.tsx` — add active-only filtering logic
- `src/app/api/subscriptions/arr/route.ts` — filter to active subscriptions (if endpoint exists from TASK-023)

## Status Log

- 2026-03-22: Created. Current subscriptions page shows all companies regardless of subscription status.

## Takeaways

_To be filled during execution_
