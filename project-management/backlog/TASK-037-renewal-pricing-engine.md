---
title: "Renewal pricing engine (same/list/uplift)"
id: TASK-037
project: PRJ-002
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #pricing, #engine]
---

# TASK-037: Renewal pricing engine (same/list/uplift)

## User Stories

- As a **Sales Manager**, I want renewal quotes priced using three configurable methods (same price, current list price, uplift percentage) so that pricing reflects our business strategy.
- As a **Finance user**, I want renewal pricing to be deterministic and auditable so that I can verify how each renewal price was calculated.

## Outcomes

A testable, pure-function pricing engine that computes renewal prices for each subscription line item based on the configured method. Produces an audit trail showing: input price, method applied, calculation details, and output price.

## Success Metrics

- [ ] `calculateRenewalPrice()` function handles all three methods
- [ ] Same Price: returns current contract unit price unchanged
- [ ] Current List Price: looks up current price book entry; falls back to same price if not found
- [ ] Uplift Percentage: applies percentage increase to current contract price
- [ ] Uplift supports per-product override (product-level > contract-level > org-level)
- [ ] All calculations use Decimal.js (no floating-point)
- [ ] Pricing audit trail: for each line, records method, input, formula, output
- [ ] Edge cases: zero-price items, missing price book entries, negative uplift (discount)
- [ ] Uplift cap enforced: maximum configurable uplift (default 50%) prevents misconfiguration
- [ ] Zero-price floor: final price never goes below $0.00
- [ ] Warning logged when `current_list` falls back to same_price (stale product catalog signal)
- [ ] Currency field on pricing input for future multi-currency support
- [ ] Comprehensive test suite with all methods and edge cases
- [ ] Round to 2 decimal places using ROUND_HALF_UP

## Implementation Plan

### Pricing Engine (Pure Functions)

```typescript
import Decimal from 'decimal.js';

export interface RenewalPricingInput {
  currentUnitPrice: Decimal;
  productHubspotId: string;
  pricingMethod: 'same_price' | 'current_list' | 'uplift_percentage';
  upliftPercentage?: Decimal;    // from product, contract, or org config
  currentListPrice?: Decimal;     // from price book lookup
}

export interface RenewalPricingOutput {
  newUnitPrice: Decimal;
  method: string;
  audit: RenewalPricingAudit;
}

export interface RenewalPricingAudit {
  inputPrice: string;
  method: string;
  formula: string;
  parameters: Record<string, string>;
  outputPrice: string;
  calculatedAt: string;
}

export function calculateRenewalPrice(input: RenewalPricingInput): RenewalPricingOutput {
  switch (input.pricingMethod) {
    case 'same_price':
      return {
        newUnitPrice: input.currentUnitPrice,
        method: 'same_price',
        audit: {
          inputPrice: input.currentUnitPrice.toString(),
          method: 'same_price',
          formula: 'new_price = current_price',
          parameters: {},
          outputPrice: input.currentUnitPrice.toString(),
          calculatedAt: new Date().toISOString(),
        },
      };

    case 'current_list':
      const listPrice = input.currentListPrice || input.currentUnitPrice;
      return {
        newUnitPrice: listPrice,
        method: 'current_list',
        audit: {
          inputPrice: input.currentUnitPrice.toString(),
          method: 'current_list',
          formula: input.currentListPrice 
            ? 'new_price = current_list_price' 
            : 'new_price = current_price (list price not found, fallback)',
          parameters: {
            currentListPrice: listPrice.toString(),
            fallbackUsed: (!input.currentListPrice).toString(),
          },
          outputPrice: listPrice.toString(),
          calculatedAt: new Date().toISOString(),
        },
      };

    case 'uplift_percentage':
      const uplift = input.upliftPercentage || new Decimal(0);
      const multiplier = new Decimal(1).plus(uplift.dividedBy(100));
      const uplifted = input.currentUnitPrice.times(multiplier)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      return {
        newUnitPrice: uplifted,
        method: 'uplift_percentage',
        audit: {
          inputPrice: input.currentUnitPrice.toString(),
          method: 'uplift_percentage',
          formula: `new_price = current_price × (1 + ${uplift}%)`,
          parameters: {
            upliftPercentage: uplift.toString(),
            multiplier: multiplier.toString(),
          },
          outputPrice: uplifted.toString(),
          calculatedAt: new Date().toISOString(),
        },
      };
  }
}
```

### Pricing Resolution Hierarchy

For each subscription, the pricing method is resolved in order:
1. **Subscription-level** override (from `contract_subscriptions.renewal_pricing_method`)
2. **Contract-level** override (from `contracts.renewal_pricing_method`)
3. **Org-level** default (from `renewal_config.default_pricing_method`)

Same for uplift percentage:
1. `contract_subscriptions.renewal_uplift_percentage`
2. `contracts.renewal_uplift_percentage`
3. `renewal_config.default_uplift_percentage`

```typescript
export function resolvePricingMethod(
  subscription: ContractSubscription,
  contract: Contract,
  config: RenewalConfig
): { method: string; upliftPercentage?: Decimal } {
  const method = subscription.renewalPricingMethod
    || contract.renewalPricingMethod
    || config.defaultPricingMethod;

  const uplift = method === 'uplift_percentage'
    ? new Decimal(
        subscription.renewalUpliftPercentage
        ?? contract.renewalUpliftPercentage
        ?? config.defaultUpliftPercentage
        ?? 0
      )
    : undefined;

  return { method, upliftPercentage: uplift };
}
```

### Current List Price Lookup

For the `current_list` method, we need to find the current price for a product. In 21CRM's sync-first architecture:

1. Products are synced to `crm_objects` where `object_type = 'products'`
2. Look up the product by `hubspot_id` matching the subscription's `product_hubspot_id`
3. Extract `properties->>'price'` as the current list price
4. If product not found or price missing, fall back to same_price method

### Test Cases

```
1. same_price: $100 input → $100 output
2. current_list with existing product: $100 contract, $120 list → $120 output
3. current_list with missing product: $100 contract, no list → $100 output (fallback)
4. uplift 5% on $100: → $105.00
5. uplift 3.5% on $99.99: → $103.49 (rounded)
6. uplift 0%: → same as same_price
7. uplift on $0 item: → $0
8. Resolution hierarchy: sub override > contract override > org default
9. Decimal precision: no floating point errors on typical SaaS prices
```

## Files to Change

- `src/lib/renewals/pricing-engine.ts` — **NEW**: Core pricing functions
- `src/lib/renewals/pricing-engine.test.ts` — **NEW**: Comprehensive pricing tests
- `src/lib/renewals/pricing-resolution.ts` — **NEW**: Hierarchy resolution
- `src/lib/renewals/pricing-resolution.test.ts` — **NEW**: Resolution tests

## Status Log

- 2026-04-12: Created

## Takeaways

_To be filled during implementation._
