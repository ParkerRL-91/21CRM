# TASK-135 — User: Contract Amendment Flow
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Enables mid-term expansion and modification revenue

---

## User Story

**As a** sales rep or CSM at PhenoTips,
**I want** to create an amendment to an active contract — to add seats, add a new module, remove a product, or change billing terms — with automatic proration calculated for the remaining contract period,
**so that** I can capture expansion revenue mid-term and give customers flexibility without requiring a full new sales cycle.

---

## Background & Context

Amendments are changes to an active contract. Common amendment types at PhenoTips:
- **Quantity increase (upsell)**: Customer buys 20 more user seats mid-term
- **New product addition**: Customer adds the CRAT module 6 months in
- **Quantity decrease (downsell)**: Customer reduces seats at renewal time only (generally)
- **Product swap (upgrade)**: Customer moves from Standard to Enterprise tier
- **Billing term change**: Switch from monthly to annual billing

Each amendment requires:
1. An Amendment Quote that shows only the changes (delta lines)
2. Proration: charges/credits calculated for the remaining contract period
3. Co-termination: the amendment co-terminates with the original contract
4. An updated contract reflecting the new terms

---

## Features Required

### 1. "Initiate Amendment" Action

Available on an Active Contract from TASK-133's Contract Management screen.

**"Initiate Amendment" modal:**
```
Amend Contract CNT-2026-0042 — Genome Diagnostics Ltd

Current Contract: May 1, 2026 – April 30, 2027 (247 days remaining)
Amendment Type:   [● Add/Remove Products   ○ Change Quantities   ○ Update Billing Terms]
Amendment Start:  [Today: Apr 19, 2026] (earliest: today; latest: contract end date - 1 day)

[Create Amendment Quote →]
```

### 2. Amendment Quote

The system creates a Quote of type = `Amendment` that:

**Shows current contract subscriptions in the line table:**
```
Product          Contracted Qty  Contracted Price  Amendment    Net Change  Prorate Multiplier  Amendment Total
PT Core               1          $34,999                                                       $0
PPQ Module            1          $12,999                                                       $0
CRAT Module           NEW        $9,999            + Added      +$9,999     × 0.75             +$7,499
SSO Integration       1          $5,999                                                        $0
```

**Key behaviors:**

- **Existing lines are shown as locked/read-only** by default (price modifications on existing subscriptions are disallowed on amendments, because price changes happen at renewal, not mid-term — this preserves audit integrity)
- **Admin override toggle** in Global CPQ Settings: "Allow price modification on existing amendment lines" (default: OFF). When ON, existing lines become editable for price but remain read-only for quantity (quantity changes are always a delta line). This is useful for corrections to historical pricing errors.
- **New lines can be added** (these are priced at current price book rates for the amendment period, subject to standard approval rules from TASK-128)
- **Quantity changes** are shown as a delta (e.g., existing 10 seats → 30 seats = +20 seats charged at prorated rate). Standard discount rules from TASK-128 apply to the delta quantity — a new quantity line that exceeds the discount threshold triggers the approval workflow.
- **Removing a product** terminates its subscription at the amendment effective date; a credit is issued for the remaining term (credit line = negative amount)
- **UX note:** A contextual help message appears on the amendment quote: "To modify prices on existing subscriptions, create a Renewal Quote instead. Amendments are for adding products or changing quantities mid-term."

**Amendment totals:**
```
Amendment-Only Total (proration of changes):  $7,499
Remaining term:  8.2 months (247 days of 365-day subscription)
Proration factor: 8.2/12 = 0.683
```

### 3. Proration Calculation

For each changed/added line:
```
Amendment Start Date: Apr 19, 2026
Contract End Date:    Apr 30, 2027
Days Remaining:       377 (gap between amendment start and contract end)
Days in Product Year: 365 (if annual subscription)
Prorate Multiplier:   377 / 365 = 1.032 (for co-termination longer than product year)
or in months:
Months Remaining:     12.4 months
Prorate Multiplier:   12.4 / 12 = 1.033
```

For products added mid-year (effective term < product subscription term):
- Prorate multiplier < 1 (rep charges only for remaining term)
- Example: CRAT added 4 months into a 12-month contract = 8/12 = 0.667 multiplier

For products removed mid-year:
- Credit: prorate multiplier × net price × quantity (negative amount)
- Credit can be applied to the amendment invoice or to future billing

### 4. Amendment Line Types

| Change Type | Line Behavior | Proration |
|-------------|---------------|-----------|
| New product added | New line, priced at current price book | Multiplied by remaining months / subscription months |
| Quantity increase | Delta line: shows `+N units`, charged for N extra units | Prorated for remaining term |
| Quantity decrease | Delta line: shows `-N units`, credit for N reduced units | Prorated credit for remaining term |
| Product removed | Termination line (negative amount) | Credit for remaining term |
| Price change | NOT allowed on amendments (only via renewal) | N/A |
| Billing term change | Quote-level field change only (e.g., monthly → annual) | Full-term invoice at amendment effective date |

### 5. Amendment Approval

Amendment quotes go through the standard approval workflow (TASK-130):
- Approval rules evaluate the amendment-only totals and the new contract ARR (not the entire current ARR)
- A new product addition that pushes ARR above the deal desk threshold triggers deal desk review
- Price discount on new lines triggers the standard discount approval chain

### 6. "Contract" the Amendment (Amendment → Contracted State)

After the amendment quote is accepted:
1. Rep clicks "Create Amendment Order" (same flow as TASK-132)
2. Amendment Order activated
3. Contract is updated:
   - New subscription records added for new/increased lines
   - Removed subscription records marked as `Terminated` with termination date
   - Contract's total ARR recalculated
   - Amendment recorded in the Amendment History tab (TASK-133)
4. Billing system updated:
   - Stripe/Chargebee subscription modified (quantity updated, new items added)
   - Proration invoice generated by billing system
5. Contract status remains `Active`

### 7. Amendment History

All amendments are recorded on the Contract's Amendment History tab (TASK-133):
```
Amendment Date  Type                  Delta ARR    Contracted By    Amendment Quote
Apr 19, 2026   Add CRAT Module       +$9,999/yr   Mike Torres      QTE-2026-0089
Jan 10, 2026   Increase PT Core +20  +$22,000/yr  Mike Torres      QTE-2026-0065
```

### 8. Co-Termination Rule

All amendment products end on the same date as the original contract:
- If the original contract ends April 30, 2027 and CRAT is added on April 19, 2026:
  - CRAT subscription ends April 30, 2027 (not a new 12-month subscription from today)
  - CRAT is priced for the remaining 12.4 months (prorated)

This is the standard co-termination model. It simplifies renewal since all products renew together.

---

## UX Requirements

- Amendment quote line table clearly distinguishes "current/locked" lines from "new/changed" lines (visual distinction: grayed-out locked lines vs. highlighted new lines)
- Proration math is shown transparently per line: "8 months remaining of 12-month subscription = 0.667×"
- "Amendment only" totals are shown separately from "full contract" totals
- Creating an amendment does NOT change the original contract record until it is "contracted" (activated)

---

## Definition of Success

- [ ] Rep can initiate an amendment from an active contract in < 60 seconds
- [ ] Adding CRAT module 8 months into a 12-month contract generates the correct prorated charge
- [ ] Removing a product generates a credit line with correct prorated credit amount
- [ ] Existing subscription prices are locked on the amendment — only new lines have editable prices
- [ ] Amendment is co-terminous with the original contract (CRAT ends when core contract ends)
- [ ] Contracting the amendment updates the contract ARR and subscription records
- [ ] Billing system receives the correct quantity modification

---

## Method to Complete

### Backend
1. `AmendmentService`:
   - `createAmendmentQuote(contractId, amendmentSettings)` — generates Amendment Quote with existing subscriptions pre-populated as locked lines
   - `calculateProration(contractId, effectiveDate, changedLines)` — computes prorate multiplier per line
   - `contractAmendment(quoteId)` — activates amendment, updates contract + subscriptions + billing
2. Enhance `Quote` entity: `type = Amendment`, `sourceContractId`
3. Enhance `QuoteLine` entity: `isAmendmentLocked` (existing lines locked), `effectiveStartDate`, `effectiveEndDate`, `changeType` (Added/Removed/Increased/Decreased)
4. Routes:
   - `POST /cpq/contracts/:id/initiate-amendment` — creates Amendment Quote
   - `POST /cpq/quotes/:id/calculate-proration` — returns proration data for amendment lines
   - `POST /cpq/orders/:id/contract-amendment` — activates amendment

### Frontend
1. `InitiateAmendmentModal.tsx` — amendment setup
2. `AmendmentQuoteLineEditor.tsx` — enhanced line editor showing locked vs. new lines
3. `ProrationsPanel.tsx` — per-line proration breakdown
4. `AmendmentTotalsSummary.tsx` — amendment-only totals vs. full contract totals
5. `useAmendmentQuote` hook

---

## Acceptance Criteria

- AC1: Amendment quote shows existing subscriptions as locked (price cannot be changed)
- AC2: New product added: prorate multiplier = (days remaining / product subscription days)
- AC3: Proration math: CRAT added with 247 days remaining on 365-day contract = 247/365 = 0.677 multiplier
- AC4: Removal credit: credit = net price × quantity × remaining prorate multiplier (negative amount)
- AC5: Co-termination: new subscription end date = original contract end date (not new 12-month from today)
- AC6: Contracting the amendment updates Contract.totalARR by the delta amount
- AC7: Billing system receives the subscription modification event within 60 seconds of amendment contracting

---

## Dependencies

- TASK-132 (Quote-to-Contract) — order and activation flow reused
- TASK-133 (Contract Management) — amendment initiated from here
- TASK-136 (Pricing Engine) — proration calculation
- TASK-139 (Contract Lifecycle) — service layer for contract update

---

## Estimated Effort
**Backend:** 4 days | **Frontend:** 4 days | **Testing:** 2 days
**Total:** 10 days
