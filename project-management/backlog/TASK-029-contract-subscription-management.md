---
title: "Build contract subscription management"
id: TASK-029
project: PRJ-002
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #subscriptions]
---

# TASK-029: Build contract subscription management

## User Stories

- As a **CS manager**, I want to add, modify, and remove subscription line items on a contract so that the contract accurately reflects the customer's current entitlements.
- As a **Finance user**, I want all subscription changes to be tracked as amendments so that there is a complete audit trail of what changed, when, and why.

## Outcomes

API routes and business logic for managing subscription lifecycle within a contract: add subscriptions, modify quantities/pricing, remove subscriptions, and track all changes as immutable amendment records.

## Success Metrics

- [ ] `POST /api/contracts/[id]/subscriptions` — add subscription with amendment logged
- [ ] `PUT /api/contracts/[id]/subscriptions/[subId]` — modify subscription (quantity, price) with amendment
- [ ] `DELETE /api/contracts/[id]/subscriptions/[subId]` — cancel subscription with amendment
- [ ] All changes create a `contract_amendments` record
- [ ] Subscription status transitions enforced (active → pending_amendment → active)
- [ ] Contract `total_value` automatically recalculated on subscription changes
- [ ] Co-termination logic: new mid-term subscriptions prorated to contract end date
- [ ] Amendment delta_value correctly computed (positive for additions, negative for removals)
- [ ] Tests for subscription CRUD, amendment generation, proration math, value recalculation

## Implementation Plan

### Subscription Addition

When adding a subscription mid-term:

1. Validate subscription fields
2. **Co-terminate**: set subscription end_date = contract end_date
3. **Prorate**: if adding mid-term, calculate prorated value using actual contract days:
   ```
   total_contract_days = contract.end_date - contract.start_date
   days_remaining = contract.end_date - effective_date
   annual_price = unit_price * quantity
   prorated_value = (annual_price / total_contract_days) * days_remaining
   ```
4. Insert subscription record
5. Create amendment record (type: `add_subscription`, delta_value: +prorated_value)
6. Update contract total_value

### Subscription Modification

When changing quantity or price:

1. Validate new values
2. Calculate delta:
   ```
   old_annual = old_unit_price * old_quantity
   new_annual = new_unit_price * new_quantity
   delta = new_annual - old_annual
   ```
3. If mid-term, prorate delta to remaining days
4. Update subscription record
5. Create amendment record (type: `quantity_change` or `price_change`, delta_value)
6. Update contract total_value

### Subscription Cancellation

Two cancellation modes:

**End-of-term cancellation** (default for B2B SaaS):
1. Set `cancel_at_period_end = true` and status = `pending_cancellation`
2. Subscription remains active until contract end date
3. Create amendment record (type: `remove_subscription`, effective_date: contract end_date)
4. Excluded from renewal quote generation
5. On contract end date, status transitions to `cancelled` with `cancelled_at` timestamp

**Immediate cancellation** (rare, admin-only):
1. Set status = `cancelled` and `cancelled_at = now()`
2. Calculate prorated refund/credit for remaining days
3. Create amendment record (type: `remove_subscription`, delta_value: -remaining_value)
4. Update contract total_value

### Subscription State Machine

Valid transitions:
```
pending → active
active → pending_amendment → active
active → pending_cancellation → cancelled
active → suspended → active
active → expired (on end_date, automated)
pending_cancellation → cancelled (on end_date, automated)
```

Invalid transitions return 422 with explanation. No reactivation of cancelled subscriptions — create a new one instead (this creates a proper amendment trail).

### Proration Engine

Core proration functions (testable, pure). Uses actual contract days, NOT hardcoded 365:

```typescript
export function calculateProratedValue(
  annualValue: Decimal,
  contractStartDate: Date,
  contractEndDate: Date,
  effectiveDate: Date
): Decimal {
  // Use actual contract days, not 365 — handles multi-year and leap years
  const totalDays = differenceInDays(contractEndDate, contractStartDate);
  if (totalDays <= 0) return new Decimal(0);
  
  const remainingDays = Math.max(0, differenceInDays(contractEndDate, effectiveDate));
  return annualValue.times(remainingDays).dividedBy(totalDays)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function calculateAmendmentDelta(
  oldSubscription: { unitPrice: Decimal; quantity: Decimal },
  newSubscription: { unitPrice: Decimal; quantity: Decimal },
  contractStartDate: Date,
  contractEndDate: Date,
  effectiveDate: Date
): Decimal {
  // Validate effective date is within contract range
  if (effectiveDate < contractStartDate || effectiveDate > contractEndDate) {
    throw new Error(`Effective date must be between contract start and end dates`);
  }
  
  const oldAnnual = oldSubscription.unitPrice.times(oldSubscription.quantity);
  const newAnnual = newSubscription.unitPrice.times(newSubscription.quantity);
  const delta = newAnnual.minus(oldAnnual);
  return calculateProratedValue(delta, contractStartDate, contractEndDate, effectiveDate);
}
```

## Files to Change

- `src/app/api/contracts/[id]/subscriptions/route.ts` — **NEW**: POST (add), GET (list)
- `src/app/api/contracts/[id]/subscriptions/[subId]/route.ts` — **NEW**: PUT (modify), DELETE (cancel)
- `src/lib/contracts/subscription-service.ts` — **NEW**: Subscription business logic
- `src/lib/contracts/proration.ts` — **NEW**: Proration calculation functions
- `src/lib/contracts/proration.test.ts` — **NEW**: Proration tests
- `src/lib/contracts/subscription-service.test.ts` — **NEW**: Service logic tests

## Status Log

- 2026-04-12: Created

## Takeaways

_To be filled during implementation._
