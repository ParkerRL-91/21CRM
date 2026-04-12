---
title: "Renewal quote auto-generation"
id: TASK-036
project: PRJ-002
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #quotes, #automation]
---

# TASK-036: Renewal quote auto-generation

## User Stories

- As a **Customer Success manager**, I want the system to auto-generate a draft renewal quote containing all active subscriptions from the expiring contract so that I have a starting point for the renewal conversation.
- As a **Sales Rep**, I want the renewal quote to have the correct start date (existing contract end date + 1 day) so that there's no gap in coverage.

## Outcomes

When a renewal opportunity is created (TASK-035), a draft renewal quote is automatically generated containing all active subscriptions from the expiring contract. The quote uses the configured pricing method (same/list/uplift) and starts the day after the current contract ends.

## Success Metrics

- [ ] Draft renewal quote auto-created alongside the renewal opportunity
- [ ] Quote contains all active subscriptions from the expiring contract as line items
- [ ] Renewal quote start date = existing contract end date + 1 day
- [ ] Renewal quote end date = start date + contract term (matching original term by default)
- [ ] Each line item priced according to configured method (same_price, current_list, uplift)
- [ ] Quote stored in `contract_renewals.proposed_subscriptions` JSONB
- [ ] Quote total = sum of all line item annual values
- [ ] Cancelled/expired subscriptions excluded from renewal quote
- [ ] One-time charge items excluded from renewal quote (only recurring)
- [ ] Quote linked to renewal opportunity and contract
- [ ] Quote editable by CS manager (adjust quantities, prices, add/remove products)
- [ ] Tests for quote generation logic, pricing application, date calculations

## Implementation Plan

### Quote Generation Flow

```typescript
export async function generateRenewalQuote(
  contract: Contract,
  renewal: ContractRenewal,
  config: RenewalConfig
): Promise<RenewalQuoteResult> {
  // 1. Get active subscriptions from the contract
  const subscriptions = await db.query.contractSubscriptions.findMany({
    where: and(
      eq(contractSubscriptions.contractId, contract.id),
      eq(contractSubscriptions.status, 'active'),
      eq(contractSubscriptions.chargeType, 'recurring'), // exclude one-time
    ),
  });

  if (subscriptions.length === 0) {
    return { success: false, reason: 'No active recurring subscriptions to renew' };
  }

  // 2. Calculate renewal pricing for each subscription
  const proposedSubscriptions = await Promise.all(
    subscriptions.map(async (sub) => {
      const pricingMethod = sub.renewalPricingMethod 
        || contract.renewalPricingMethod 
        || config.defaultPricingMethod;
      
      const newPrice = await calculateRenewalPrice(sub, pricingMethod, config);
      
      return {
        subscriptionId: sub.id,
        productHubspotId: sub.productHubspotId,
        productName: sub.productName,
        quantity: sub.quantity,
        oldUnitPrice: sub.unitPrice,
        newUnitPrice: newPrice,
        oldAnnualValue: sub.annualValue,
        newAnnualValue: newPrice.times(sub.quantity),
        pricingMethod: pricingMethod,
        billingFrequency: sub.billingFrequency,
      };
    })
  );

  // 3. Calculate total proposed value
  const proposedTotalValue = proposedSubscriptions.reduce(
    (sum, sub) => sum.plus(sub.newAnnualValue),
    new Decimal(0)
  );

  // 4. Calculate renewal dates
  const proposedStartDate = addDays(contract.endDate, 1);
  const termMonths = differenceInMonths(contract.endDate, contract.startDate);
  const proposedEndDate = addMonths(proposedStartDate, termMonths);

  // 5. Update renewal record with quote data
  await db.update(contractRenewals)
    .set({
      proposedStartDate,
      proposedEndDate,
      proposedTermMonths: termMonths,
      proposedTotalValue: proposedTotalValue.toNumber(),
      proposedSubscriptions: proposedSubscriptions,
      quoteGeneratedAt: new Date(),
      status: 'pending',
    })
    .where(eq(contractRenewals.id, renewal.id));

  // 6. Update contract renewal status
  await db.update(contracts)
    .set({ renewalStatus: 'quote_generated' })
    .where(eq(contracts.id, contract.id));

  return {
    success: true,
    subscriptionCount: proposedSubscriptions.length,
    totalValue: proposedTotalValue.toNumber(),
    startDate: proposedStartDate,
    endDate: proposedEndDate,
  };
}
```

### Date Logic

```
Contract:        [Jan 1, 2026 ────────── Dec 31, 2026]
Renewal Quote:                                          [Jan 1, 2027 ──── Dec 31, 2027]
                                                         ↑
                                                  end_date + 1 day
```

**Edge cases:**
- Leap year: Feb 29 contract end → Mar 1 renewal start
- Month-end: Jan 31 contract end → Feb 1 renewal start
- Multi-year: if original term is 24 months, renewal term defaults to 24 months

### Pricing Method Application

See TASK-037 for the full pricing engine. This task calls into it:

```typescript
async function calculateRenewalPrice(
  subscription: ContractSubscription,
  method: string,
  config: RenewalConfig
): Promise<Decimal> {
  switch (method) {
    case 'same_price':
      return new Decimal(subscription.unitPrice);
    
    case 'current_list':
      // Look up current price book entry for this product
      const currentPrice = await getCurrentListPrice(subscription.productHubspotId);
      return currentPrice || new Decimal(subscription.unitPrice); // fallback to same price
    
    case 'uplift_percentage':
      const uplift = subscription.renewalUpliftPercentage 
        || contract.renewalUpliftPercentage 
        || config.defaultUpliftPercentage;
      return new Decimal(subscription.unitPrice)
        .times(new Decimal(1).plus(new Decimal(uplift).dividedBy(100)));
    
    default:
      return new Decimal(subscription.unitPrice);
  }
}
```

### Quote Editing API

After auto-generation, CS managers need to edit the quote:

- `PUT /api/renewals/[renewalId]/quote` — update proposed subscriptions (add/remove/modify)
- UI shows a quote editor with line items table, pricing overrides, and total recalculation
- Changes to proposed subscriptions update `contract_renewals.proposed_subscriptions` and `proposed_total_value`

## Files to Change

- `src/lib/renewals/quote-generator.ts` — **NEW**: Quote generation logic
- `src/lib/renewals/quote-generator.test.ts` — **NEW**: Tests for generation
- `src/app/api/renewals/[renewalId]/quote/route.ts` — **NEW**: Quote editing endpoint
- `src/lib/renewals/job.ts` — **MODIFY**: Wire quote generation after opportunity creation
- `src/components/renewals/renewal-quote-editor.tsx` — **NEW**: Quote editing UI

## Status Log

- 2026-04-12: Created — implements US-8.2 acceptance criteria (quote generation part)

## Takeaways

_To be filled during implementation._
