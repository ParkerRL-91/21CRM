# TASK-129 — User: Quote Summary Panel & Totals
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Essential context for every quoting decision

---

## User Story

**As a** sales rep at PhenoTips,
**I want** a persistent, real-time quote summary panel that shows me the deal's total value, MRR, ARR, discount depth, and margin at a glance as I build the quote,
**so that** I always understand the commercial shape of the deal I'm constructing and can make informed trade-off decisions without mental arithmetic.

---

## Background & Context

A rep building a 5-product PhenoTips quote needs to track: recurring revenue vs. one-time, aggregate discount depth, MRR, ARR, and whether the deal will trigger approvals. Without a live summary, they're flying blind.

The summary panel is the "dashboard" of the quote line editor — always visible, always current. It answers the questions:
- "What is this deal worth annually?"
- "How deep am I discounting in total?"
- "Will this quote need approval?"
- "What does the customer actually pay vs. what we listed?"

---

## Features Required

### 1. Sticky Bottom Totals Bar (Always Visible)
Displayed at the bottom of the Quote Line Editor page, never scrolled out of view:

```
Subtotal:  $127,997/yr    Discount:  $16,000 (-12.5%)    Net Total:  $111,997/yr    MRR:  $9,333/mo    ARR:  $111,997/yr    One-Time:  $15,000
```

**Metrics in the sticky bar:**
- `Subtotal` — sum of list prices × quantities (before discounts)
- `Discount` — total discount amount and total discount % (dollar and %)
- `Net Total` — net recurring annual total
- `MRR` — Monthly Recurring Revenue (net recurring / billing frequency)
- `ARR` — Annual Recurring Revenue
- `One-Time Total` — sum of one-time line items (shown separately from recurring)

All values update within 500ms of any field change.

### 2. Expanded Quote Summary Panel
Clicking the bottom bar (or a "See Details" link) expands a slide-up panel with the full breakdown:

**Recurring Revenue:**
```
By Product Family:
  PT Core:                 $46,999/yr
  Add-Ons (PPQ):           $12,999/yr
  Integrations (SSO):       $5,999/yr
  ─────────────────────────────────────
  Recurring Subtotal:      $65,997/yr
  Discount:               -$8,000 (-12.1%)
  Recurring Net:           $57,997/yr
```

**One-Time Charges:**
```
  Professional Services:   $15,000
  NLP Training:            $0 (included)
  ─────────────────────────────────────
  One-Time Total:          $15,000
```

**Tax:**
```
  VAT 20% (UK quotes):     $11,599
  or: Tax exempt
  or: Tax: $0 (US SaaS — exempt)
```

**Grand Total:**
```
  ─────────────────────────────────────
  Net Recurring (ARR):     $57,997/yr
  One-Time Total:          $15,000
  Tax:                     $11,599
  ═════════════════════════════════════
  Grand Total:             $84,596
  (First-year commitment)
```

**Margin Summary (permission-gated):**
```
  Total Cost:              $18,500
  Gross Margin:            $39,497 (68.1%)
```

### 3. Approval Risk Indicator
Within the summary panel, show whether the current quote will trigger approvals:

```
Approval Status:
  ⚠ Manager approval required (Max discount: 22% > 15% threshold)
  ⚠ Deal Desk review (ARR > $100K threshold)
  [Preview Approval Path →]
```

Green (no approval needed):
```
Approval Status:
  ✓ Within rep authorization (Max discount: 8%)
```

This is recalculated in real-time as discounts change — so the rep can see instantly when they cross a threshold.

### 4. Deal Metrics Summary
A set of key deal metrics displayed as a summary card on the Quote detail page (not just in the editor):

- **MRR**: `$5,583/mo`
- **ARR**: `$66,999/yr`
- **One-Time**: `$15,000`
- **First-Year Total**: `$81,999`
- **Average Discount**: `12.1%`
- **Max Line Discount**: `22%` (highlighted red if above threshold)
- **Subscription Term**: `12 months`
- **Deal Start**: `May 1, 2026`
- **Deal End**: `April 30, 2027`
- **Expiration Date**: `May 20, 2026` (highlighted red if within 5 days)

This card appears:
- On the Quote Detail page (always visible)
- In the approval email summary
- In the comparison modal (side-by-side for multiple quotes)

### 5. Term Analysis

For multi-year quotes:
```
Term Analysis:
  Year 1:  $57,997/yr  (no uplift)
  Year 2:  $60,897/yr  (+5% renewal uplift)
  Year 3:  $63,942/yr  (+5% renewal uplift)
  ─────────────────────────────────────────
  3-Year TCV:  $182,836
```

This is calculated from the renewal uplift setting in Global CPQ Settings. It's a projection, not a contract commitment.

### 6. Quote vs. Opportunity Sync Status
If the quote is the primary quote on an opportunity:
```
Opportunity Sync:
  ✓ Opportunity Amount synced: $66,999 (last synced 2 min ago)
  Opportunity Stage: Discovery → update to "Proposal Sent"? [Update Stage]
```

---

## UX Requirements

- Sticky bar is always visible — does not scroll away even on very long line lists
- Numbers animate smoothly when they change (brief count-up animation on large changes)
- Currency formatting is locale-aware: `$66,999.00` (US) vs. `£52,999.00` (UK)
- Large numbers abbreviated in compact view: `$1.2M ARR` (with full number on hover)
- Summary panel responds to dark mode and uses Twenty's design system tokens

---

## Definition of Success

- [ ] Sticky bar shows correct values for all 5 metrics immediately after adding the first product
- [ ] Totals update within 500ms of changing a line's quantity or discount
- [ ] Approval risk indicator turns red when a discount exceeds the approval threshold
- [ ] Expanded panel correctly separates recurring and one-time charges by product family
- [ ] Term analysis shows correct year-over-year projections with configured uplift %
- [ ] MRR and ARR compute correctly: ARR = net recurring total; MRR = ARR ÷ 12

---

## Method to Complete

### Backend
The primary computation happens in the Pricing Engine (TASK-136). This task adds:
1. Aggregate fields on the `Quote` entity: `subtotal`, `totalDiscount`, `netTotal`, `mrr`, `arr`, `oneTimeTotal`, `taxTotal`, `grandTotal`, `maxLineDiscount`, `avgDiscount`
2. `QuoteCalculationService.rollupTotals(quoteId)` — called after every line change; updates all rollup fields
3. `GET /cpq/quotes/:id/summary` — returns full summary object (all aggregates + approval risk assessment)
4. Approval risk assessment in `ApprovalService.assessRisk(quoteId)` — returns which rules would fire

### Frontend
1. `QuoteTotalsBar.tsx` — sticky bottom bar with 6 metrics
2. `QuoteSummaryPanel.tsx` — slide-up expanded panel
3. `QuoteSummaryCard.tsx` — compact summary card on quote detail page
4. `ApprovalRiskIndicator.tsx` — approval warning component within summary
5. `TermAnalysisTable.tsx` — multi-year projection table
6. `useQuoteSummary` hook — fetches summary and updates on changes

---

## Acceptance Criteria

- AC1: Sticky bar is visible at all scroll positions in the quote line editor
- AC2: Changing quantity of one line updates all 6 summary metrics within 500ms
- AC3: Approval risk indicator correctly identifies when max line discount > threshold
- AC4: One-time charges are correctly separated from recurring in the expanded summary
- AC5: ARR = sum of all annual recurring line totals; MRR = ARR ÷ 12
- AC6: Opportunity Amount is updated to match Quote Net Total when quote is primary

---

## Dependencies

- TASK-127 (Product Configurator) — line editor context
- TASK-128 (Pricing & Discount Controls) — discount values drive the summary
- TASK-136 (Pricing Engine) — all rollup calculations performed here

---

## Estimated Effort
**Backend:** 1 day | **Frontend:** 2 days | **Testing:** 0.5 days
**Total:** 3.5 days
