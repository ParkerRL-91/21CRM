---
title: "Contract amendment tracking UI"
id: TASK-032
project: PRJ-002
status: done
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #amendments, #ui]
---

# TASK-032: Contract amendment tracking UI

## User Stories

- As a **Customer Success manager**, I want to initiate a formal contract amendment workflow so that mid-term changes are properly documented and the contract value is updated accurately.
- As a **Finance user**, I want to see the complete amendment history with financial impact so that I can reconcile contract values and understand how a contract evolved over time.

## Outcomes

A dedicated amendment workflow UI that guides users through creating amendments (add product, change quantity, change price, extend term) with automatic proration calculations, preview of financial impact, and immutable amendment record creation.

## Success Metrics

- [ ] "Amend Contract" button opens amendment wizard
- [ ] Wizard supports amendment types: add subscription, quantity change, price change, term extension
- [ ] Proration automatically calculated and displayed before confirmation
- [ ] Amendment preview shows: what changes, financial impact (delta), effective date
- [ ] Confirmation creates amendment record and updates contract/subscriptions atomically
- [ ] Amendment history on contract detail is fully interactive (expandable details)
- [ ] Amendment records link to originating deal/quote when applicable
- [ ] Undo not available (amendments are immutable) — clear warning shown before confirm

## Implementation Plan

### Amendment Wizard Flow

```
Step 1: Select Type          Step 2: Configure           Step 3: Review & Confirm
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│ ○ Add Product    │    →    │ Select product   │    →    │ Summary:         │
│ ○ Change Qty     │         │ Set quantity     │         │ Adding: Widget X │
│ ○ Change Price   │         │ Set price        │         │ Qty: 10          │
│ ○ Extend Term    │         │ Effective date   │         │ Annual: $5,000   │
│ ○ Cancel Sub     │         │ Notes            │         │ Prorated: $3,425 │
└──────────────────┘         └──────────────────┘         │ Delta: +$3,425   │
                                                           │                  │
                                                           │ [Cancel] [Apply] │
                                                           └──────────────────┘
```

### Proration Preview

Before confirming, show:
- Original contract value
- Amendment delta (prorated)
- New contract total
- Effective date
- Days remaining on contract
- Per-day rate for prorated items

### Amendment Types

| Type | What Changes | Delta Calculation |
|------|-------------|-------------------|
| Add Subscription | New subscription record | +(annual_value × days_remaining / total_days) |
| Quantity Change | Subscription quantity | (new_qty - old_qty) × unit_price × proration_factor |
| Price Change | Subscription unit_price | (new_price - old_price) × quantity × proration_factor |
| Term Extension | Contract end_date, subscription end_dates | Recalculates based on new end date |
| Cancel Subscription | Subscription status → cancelled | -(annual_value × days_remaining / total_days) |

## Files to Change

- `src/components/contracts/amendment-wizard.tsx` — **NEW**: Multi-step amendment wizard
- `src/components/contracts/amendment-preview.tsx` — **NEW**: Financial impact preview
- `src/components/contracts/amendment-type-selector.tsx` — **NEW**: Amendment type selection
- `src/app/api/contracts/[id]/amendments/route.ts` — **NEW**: POST create amendment, GET list
- `src/lib/contracts/amendment-service.ts` — **NEW**: Amendment business logic
- `src/lib/contracts/amendment-service.test.ts` — **NEW**: Amendment logic tests

## Status Log

- 2026-04-12: Created

## Takeaways

_To be filled during implementation._
