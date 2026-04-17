---
title: "Add Product, PriceBook, PriceBookEntry objects to CPQ setup"
id: TASK-101
project: PRJ-004
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #products, #pricing, #critical]
---

# TASK-101: Add Product, PriceBook, PriceBookEntry objects to CPQ setup

## User Stories

- As a Sales Manager, I want a product catalog so that reps select from approved products when building quotes instead of typing free-text product names.
- As a Finance user, I want price books so that different customer segments (Standard, Partner, Academic) get appropriate pricing from a controlled source of truth.
- As a Sales Rep, I want prices auto-populated from the price book when I add a product to a quote so that I don't have to look up pricing manually.

## Why This Is P0

Without Product/PriceBook/PriceBookEntry objects:
- Quote line items use free-text productName with no catalog integrity
- Price snapshotting (the #1 most critical CPQ rule) cannot be enforced — there's no price book to snapshot FROM
- No controlled pricing — reps can enter any amount
- No discount schedule linkage — tiers can't be associated with specific products
- The entire pricing engine has no upstream data source

## Outcomes

CpqSetupService creates 3 additional custom objects (Product, PriceBook, PriceBookEntry) with all fields and relations, bringing the total from 6 to 9 objects. QuoteLineItem gains a relation to Product. PriceBookEntry links Product × PriceBook with a unit price.

## Success Metrics

- [ ] Product object created with fields: name, sku, description, productType (SELECT: subscription/one_time/service), family, isActive (BOOLEAN), defaultSubscriptionTermMonths (NUMBER), billingFrequency (SELECT), chargeType (SELECT), defaultPrice (CURRENCY)
- [ ] PriceBook object created with fields: name, isStandard (BOOLEAN), isActive (BOOLEAN), currencyCode (TEXT), description
- [ ] PriceBookEntry object created with fields: unitPrice (CURRENCY), currencyCode (TEXT), isActive (BOOLEAN), effectiveDate (DATE), expirationDate (DATE)
- [ ] Relations: PriceBookEntry → Product (MANY_TO_ONE), PriceBookEntry → PriceBook (MANY_TO_ONE), QuoteLineItem → Product (MANY_TO_ONE, NEW)
- [ ] Quote gains priceBookId relation to PriceBook
- [ ] Existing setup tests updated
- [ ] Templates updated to reference Product objects

## Implementation Plan

Add to CPQ_OBJECTS in cpq-setup.service.ts:

```typescript
product: {
  nameSingular: 'product',
  namePlural: 'products',
  labelSingular: 'Product',
  labelPlural: 'Products',
  description: 'Sellable items in the product catalog',
  icon: 'IconBox',
},
priceBook: {
  nameSingular: 'priceBook',
  namePlural: 'priceBooks',
  labelSingular: 'Price Book',
  labelPlural: 'Price Books',
  description: 'Price lists for different customer segments',
  icon: 'IconBook',
},
priceBookEntry: {
  nameSingular: 'priceBookEntry',
  namePlural: 'priceBookEntries',
  labelSingular: 'Price Book Entry',
  labelPlural: 'Price Book Entries',
  description: 'Links a product to a price book with a unit price',
  icon: 'IconCurrencyDollar',
},
```

Add corresponding CPQ_FIELDS and CPQ_RELATIONS entries.

## Files to Change

- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-setup.service.ts` — add 3 objects + fields + relations
- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-setup.service.spec.ts` — update counts (6→9 objects)
