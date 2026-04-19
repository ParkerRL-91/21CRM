# TASK-128 — User: Quote Line Editor — Pricing & Discount Controls
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Core usability of the quoting experience

---

## User Story

**As a** sales rep at PhenoTips,
**I want** fine-grained control over pricing and discounts on individual quote lines, with clear feedback on floor prices, approval requirements, and margin impact,
**so that** I can apply the right discount to close a deal while staying within authorized limits and understanding the commercial impact of every change.

---

## Background & Context

This task specifies the detailed pricing controls within the Quote Line Editor (TASK-127). While TASK-127 covers the overall layout and product selection, this task dives into how individual lines are priced and the controls available to a rep.

Key principles:
- **Transparency:** Show the rep every pricing lever and its effect
- **Guardrails:** Floor prices, max discount %, and non-discountable flags are enforced
- **Approval triggers:** When a rep exceeds their authorization, the approval workflow fires (TASK-130) — but the rep should see a clear warning before reaching that point
- **Real-time feedback:** Every change recalculates immediately

---

## Features Required

### 1. Line-Level Pricing Fields

Each quote line has these pricing controls accessible inline:

| Field | Rep Control | Behavior |
|-------|------------|---------|
| `Quantity` | Editable number input | Triggers volume discount schedule recalculation |
| `Start Date` | Date picker | Affects proration calculation; default from quote |
| `End Date` | Read-only (derived) | Shown for reference |
| `Discount %` | Number input (% suffix) | Max constrained by `product.maxManualDiscount`; floor price enforced |
| `Special Price` | Currency input | Sets a fixed unit price override; bypasses list+discount waterfall |
| `List Price` | Read-only (from price book) | Shown for reference |
| `Net Price` | Read-only (calculated) | List Price after all discounts and rules |
| `Line Total` | Read-only (calculated) | Net Price × Quantity × Prorate Multiplier |
| `MRR` | Read-only (calculated) | Line Total ÷ 12 (for annual lines) |

### 2. Discount Controls

**Manual Discount Input:**
- Shown as a percentage input field (`%` suffix)
- Real-time validation: turns red if `input > product.maxManualDiscount`
- Error inline: "Max authorized discount is 15%. Discounts above 15% require approval."
- Rep can still enter the higher discount — it will trigger the approval workflow on save (not blocked)
- If `product.allowManualDiscount = false` (non-discountable): field is disabled and grayed out with tooltip "This product's price is fixed"

**Special Price Override:**
- Activated by clicking "Set Special Price" link (collapses the discount field)
- Directly sets the unit price regardless of list price + discounts
- Subject to floor price check: if `specialPrice < product.floorPrice`, shows warning: "This price is below the minimum net price ($X)"
- Rep can still set the special price — it will appear in the approval routing as a floor price violation

**Approval Warning Banner:**
Before the rep submits, if any line has a discount or price that exceeds authorization:
```
⚠ This quote requires approval:
• PT Core: 22% discount exceeds your 15% authorization (Sales Manager required)
• HL7v2 Integration: Special price $4,200 is below floor price of $4,999 (Deal Desk required)
[Preview Approval Path]   [Submit Anyway]
```

### 3. Quote-Level Discount Controls

In addition to line-level discounts, a rep can apply a quote-level discount:
- **Additional Discount %** — applied uniformly to all non-protected lines
- **Customer Discount %** — a specific "customer negotiated" discount field shown on the document
- Both appear in the quote totals section (not per-line)
- These fields are also subject to approval thresholds

### 4. Price Waterfall (Per Line Detail)

A rep can expand any line to see the full price cascade:

```
List Price:                    $34,999.00
Discount Schedule (Range):     -10.0%     ($3,499.90)  [11-50 users tier]
─────────────────────────────────────────
Customer Price:                $31,499.10
Manual Discount:               -5.0%      ($1,574.96)
─────────────────────────────────────────
Net Unit Price:                $29,924.14
Prorate Multiplier:            ×1.0       (12/12 months)
─────────────────────────────────────────
Line Net Total:                $29,924.14
```

This is accessible via:
- A small "eye" icon on each line → opens a tooltip/popover with the waterfall
- An "Expand All Waterfalls" toggle at the top of the line table

### 5. Term & Proration Controls

**Subscription Term Override per Line:**
- If the quote has a default 12-month term but a line needs a different term (e.g., mid-deal upsell proration), the rep can set a custom start/end date per line
- System calculates `prorateMultiplier = effectiveTerm ÷ productSubscriptionTerm`
- Example: "12-month product added 4 months into an annual quote → prorate multiplier = 8/12 = 0.667"
- Prorated line total is labeled clearly: "Prorated for 8 months remaining"

**Effective Start / End (for Amendments):**
- On amendment quotes: each line shows the original contracted dates alongside the amendment effective dates
- The system handles co-termination automatically (amendment lines co-terminate with original contract)

### 6. Margin Display (Permission-Gated)

If rep has `SHOW_MARGIN` permission (admin-configured):
- Each line shows `Cost Basis`, `Gross Margin $`, `Gross Margin %`
- Quote totals show aggregate margin
- These columns are never shown on the customer-facing quote document — only in the editor and internal approval view

### 7. Multi-Currency Display

When a quote is in GBP or CAD:
- All currency fields display with the correct symbol
- List prices shown as the price from the matching currency price book entry
- Tax line displayed in quote currency

### 8. Bulk Line Operations

Checkboxes on each line allow bulk actions:
- **Bulk Discount:** apply the same discount % to all selected lines
- **Bulk Change Billing Frequency:** override billing freq on selected lines
- **Bulk Delete:** remove all selected lines (confirmation required)
- **Bulk Move to Group:** assign selected lines to a quote line group

---

## UX Requirements

- Quantity and discount inputs are single-click to enter (no double-click required)
- Floor price violation shows yellow warning (not red error) — it's allowed but triggers approval
- Discount > maxManualDiscount shows a red inline message but does NOT block save — it queues the approval
- "Preview Approval Path" link shows a non-blocking slide-over with the expected approval steps
- Price recalculation spinner appears per-line (not a global overlay that blocks the UI)
- Keyboard: Tab moves between editable fields in the correct order (quantity → discount → next line)

---

## Definition of Success

- [ ] Changing quantity from 10 to 30 triggers volume discount schedule and updates net price
- [ ] Entering a discount above `maxManualDiscount` shows a red warning but allows save (queues approval)
- [ ] Entering a special price below floor price shows a yellow warning
- [ ] Price waterfall shows the correct breakdown matching the net price
- [ ] Non-discountable products have the discount field disabled with a tooltip
- [ ] Bulk discount operation applies the same % to 3 selected lines simultaneously
- [ ] Quote-level additional discount reduces all non-protected line totals proportionally
- [ ] Proration for a 10-month effective term (from a 12-month product) computes correctly as 0.833×

---

## Method to Complete

### Backend
All pricing logic lives in the Pricing Engine (TASK-136). This task's backend work is:
1. `QuoteLine.additionalDiscount`, `QuoteLine.specialPrice`, `QuoteLine.specialPriceType` fields on the entity
2. `QuoteLine.prorateMultiplier` (computed + stored), `QuoteLine.effectiveStartDate`, `QuoteLine.effectiveEndDate`
3. `QuoteLine.listPrice`, `QuoteLine.customerPrice`, `QuoteLine.netPrice`, `QuoteLine.netTotal` (stored results)
4. `QuoteLine.costBasis`, `QuoteLine.margin`, `QuoteLine.marginPercent` (stored if cost basis on product)
5. Validation in `QuoteLineService.updateLine()`: floor price check returns `{ warning: 'FLOOR_PRICE_VIOLATION', floorPrice }`, not an error
6. `POST /cpq/quotes/:id/lines/bulk-discount` — bulk discount endpoint

### Frontend
1. `QuoteLineRow.tsx` (enhanced from TASK-127) — pricing fields
2. `PriceWaterfallPopover.tsx` — per-line waterfall breakdown
3. `ApprovalWarningBanner.tsx` — pre-submission warnings
4. `ApprovalPathPreviewPanel.tsx` — slide-over showing expected approval steps
5. `BulkActionToolbar.tsx` — bulk operations bar (appears when lines are checked)
6. `MarginColumns.tsx` — permission-gated margin columns
7. `LineDiscountInput.tsx` — discount input with validation states

---

## Acceptance Criteria

- AC1: Discount > 0 on a NonDiscountable product is blocked (field is disabled)
- AC2: Discount > maxManualDiscount shows inline red message; quote can still be saved and will require approval
- AC3: Special price < floor price shows inline yellow warning; quote can still be saved and will require approval
- AC4: Price waterfall breakdown in the tooltip sums correctly to the displayed line net total
- AC5: Bulk discount applied to 3 lines: all 3 lines show updated net price after the operation
- AC6: Prorate multiplier for an 8-month effective term = 8/12 = 0.667; line total = net price × 0.667
- AC7: Margin columns are visible only to users with `SHOW_MARGIN` permission

---

## Dependencies

- TASK-127 (Product Configurator) — line table where controls appear
- TASK-119 (Discount Schedules) — volume discounts fire on quantity change
- TASK-120 (Price Rules) — rules fire during recalculation
- TASK-121 (Approval Workflow) — approval routing triggered by threshold violations
- TASK-136 (Pricing Engine) — all calculations delegated here

---

## Estimated Effort
**Backend:** 2 days | **Frontend:** 3 days | **Testing:** 1 day
**Total:** 6 days
