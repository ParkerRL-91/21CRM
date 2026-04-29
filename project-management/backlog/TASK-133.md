---
title: Billing type toggle (recurring vs one-time)
id: TASK-133
project: PRJ-006
status: ready
priority: P2
tier: 3
effort: 1 day
created: 2026-04-29
updated: 2026-04-29
dependencies: [TASK-116]
tags: [cpq, billing, recurring, one-time, line-item, differentiator]
---

# TASK-133 — Billing Type Toggle (Recurring vs One-Time)

## Context

The quote builder has no way to set the billing type for each line item. Dana Chen noticed: "I can't change the billing type — it's hardcoded to 'recurring' with a emoji. What if this is a one-time implementation fee?"

The product catalog (`cpq-phenotips-catalog.ts`) already has an `isOneTime` field on each product, and the `CpqSetupPage.tsx` renders a `StyledBillingType` badge showing "One-Time" or "Recurring". But the quote builder ignores this field — all line items are implicitly recurring.

Depends on TASK-116 (Product Catalog Picker) because when a product is selected from the catalog, the billing type should auto-fill from the product's `isOneTime` field, while still allowing manual override.

## User Stories

**As Alex (Sales Rep)**, I want to mark a line item as "one-time" for implementation fees and "recurring" for subscriptions, so that the quote accurately reflects what the customer will be billed.

**As Raj (Deal Desk Specialist)**, I want the billing type to auto-fill from the product catalog but be overridable per line item, so that I can handle non-standard billing arrangements.

**As Dana (VP RevOps)**, I want the quote total to clearly separate recurring revenue from one-time fees, so that I can report accurate ARR to the board.

## Outcomes

- Each line item in the quote builder has a billing type toggle: "Recurring" or "One-Time"
- Selecting a product from the catalog auto-sets the billing type from the product's `isOneTime` field
- The billing type is displayed as a small toggle or badge in the line item row
- The totals section separates recurring subtotal and one-time subtotal
- The quote PDF (TASK-119) includes the billing type column

## Success Metrics

- [ ] Each line item shows a billing type indicator
- [ ] Billing type defaults based on selected product's `isOneTime` field
- [ ] User can toggle between "Recurring" and "One-Time" on any line item
- [ ] Totals section shows "Recurring Subtotal" and "One-Time Subtotal" separately
- [ ] Grand total combines both
- [ ] Billing type badge uses color coding (green for recurring, purple for one-time) matching CpqSetupPage style
- [ ] PDF generation includes billing type column
- [ ] Unit tests pass for toggle behavior and total separation

## Implementation Plan

### Step 1: Update LineItem type

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

Add `billingType` to the `LineItem` type:
```typescript
type LineItem = {
  id: string;
  productName: string;
  listPrice: string;
  quantity: number;
  discountPercent: number;
  netTotal: string | null;
  billingType: 'recurring' | 'one_time';  // new field
  sku: string;  // from TASK-116
};
```

Update `newLineItem()` to default `billingType: 'recurring'`.

### Step 2: Create the BillingTypeToggle component

Create `packages/twenty-front/src/modules/cpq/components/CpqBillingTypeToggle.tsx`:

```typescript
type CpqBillingTypeToggleProps = {
  value: 'recurring' | 'one_time';
  onChange: (value: 'recurring' | 'one_time') => void;
  compact?: boolean; // for use in table cells
};
```

The component renders a small toggle or segmented control:
- Two options: "Recurring" (green) and "One-Time" (purple)
- Compact mode for table cells: just a small badge that toggles on click
- Uses the same color scheme as `StyledBillingType` in `CpqSetupPage.tsx`:
  - Recurring: `background: rgba(16,185,129,0.1); color: #059669`
  - One-Time: `background: rgba(139,92,246,0.1); color: #7c3aed`

### Step 3: Add billing type column to the line items table

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

- Add a "Billing" column header in the table
- Add `<CpqBillingTypeToggle>` in each line item row
- When product is selected from catalog (TASK-116), auto-set `billingType` based on `product.isOneTime`

### Step 4: Separate totals by billing type

Modify the totals calculation in `QuoteBuilderPage.tsx`:

```typescript
const recurringSubtotal = lineItems
  .filter(li => li.billingType === 'recurring')
  .reduce((sum, li) => sum + parseFloat(li.netTotal ?? '0'), 0);

const oneTimeSubtotal = lineItems
  .filter(li => li.billingType === 'one_time')
  .reduce((sum, li) => sum + parseFloat(li.netTotal ?? '0'), 0);

const grandTotal = recurringSubtotal + oneTimeSubtotal;
```

Update the `StyledTotalsRow` to show three rows:
- Recurring Subtotal (with green recurring icon)
- One-Time Subtotal (with purple one-time icon)
- Grand Total (bold)

### Step 5: Update PDF template (if TASK-119 is complete)

Modify `packages/twenty-front/src/modules/cpq/components/CpqQuotePdfDocument.tsx`:

- Add "Billing" column to the line items table
- Show "Recurring" or "One-Time" for each row
- Separate totals in PDF to match the UI

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqBillingTypeToggle.tsx`
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — add billing column, separate totals
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — export new component
- **Possibly modify**: `packages/twenty-front/src/modules/cpq/components/CpqQuotePdfDocument.tsx` — add billing column to PDF

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqBillingTypeToggle.test.tsx`

- `should render with "Recurring" selected by default`
- `should toggle to "One-Time" on click`
- `should toggle back to "Recurring" on second click`
- `should call onChange with new value`
- `should render in compact mode for table cells`
- `should use correct colors for each type`

### Integration tests: `packages/twenty-front/src/pages/cpq/__tests__/QuoteBuilderPage.billing.test.tsx`

- `should auto-set billing type from selected product`
- `should allow manual override of billing type`
- `should separate recurring and one-time subtotals`
- `should show correct grand total combining both types`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
