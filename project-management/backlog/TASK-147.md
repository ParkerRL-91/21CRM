# TASK-147 — Admin: Contracted Prices (Account-Level Price Overrides)
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Required for enterprise deal negotiation; prevents price book changes from breaking existing renewals

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** to lock negotiated prices for specific accounts on specific products,
**so that** when we update our standard price book, existing enterprise customers don't have their renewal quotes auto-inflated, and sales reps can honor committed pricing without needing a special discount every time.

---

## Background & Context

Enterprise customers often negotiate a committed price that remains fixed for a defined term (e.g., "£28,000/yr for PT Core for 3 years regardless of list price changes"). In Salesforce CPQ this is called a "Contracted Price."

Without this:
- Reps must manually re-apply discounts each renewal cycle to restore the negotiated rate
- Price book updates accidentally appear on renewal quotes for grandfathered accounts
- Finance has no auditable record of what was promised to which account and for how long

The `ContractedPrice` is the mechanism: it stores the account-specific net unit price and sits at Step 5 of the pricing waterfall (between Discount Schedules and Manual Discounts), overriding the standard price book entry for that account.

---

## Data Model

### `ContractedPrice` Entity

```typescript
type ContractedPrice = {
  id: string;
  accountId: string;               // FK → Account
  productId: string;               // FK → Product (the specific product)
  priceBookId: string | null;      // null = applies to any price book for this account
  contractedUnitPrice: number;     // The committed net unit price (in quote currency)
  currency: CurrencyCode;          // 'USD' | 'GBP' | 'EUR'
  effectiveDate: Date;             // When this price becomes active
  expirationDate: Date | null;     // null = no expiry; typically set to contract end date
  sourceContractId: string | null; // FK → Contract that established this price (optional, for audit)
  sourceQuoteId: string | null;    // FK → Quote that first applied this price (optional)
  notes: string | null;            // e.g. "3-year commitment agreed with CFO, Jan 2025"
  isActive: boolean;               // Admin can deactivate without deleting
  createdBy: string;               // userId
  createdAt: Date;
  updatedAt: Date;
};
```

**Key rules:**
- A `ContractedPrice` is account + product + currency specific
- If multiple contracted prices match (overlapping date ranges), the most recently effective wins
- A contracted price overrides ALL upstream price book and discount schedule steps but is itself overridable by a manual discount (step 6) or special price (step 6)
- If `expirationDate` is set and past, the pricing waterfall treats this entry as non-existent and falls back to standard pricing
- When an Order is activated into a Contract (TASK-132), the system can optionally auto-create `ContractedPrice` records from the finalized line prices (admin toggle: "Auto-lock contracted prices on activation")

---

## Features Required

### 1. Contracted Prices at the Account Level

On the Account record, a new "Contracted Prices" tab (or section in the account detail sidebar):

```
Account: Genome Diagnostics Ltd
Contracted Prices                              [+ Add Contracted Price]

Product            Currency  Unit Price    Effective       Expires        Source       Status
PT Core            GBP       £27,500/yr    Jan 1, 2025     Dec 31, 2027   Contract-089  Active
PPQ Module         GBP       £10,800/yr    Jan 1, 2025     Dec 31, 2027   Contract-089  Active
CRAT Module        GBP       £8,500/yr     Mar 1, 2025     Dec 31, 2027   Quote-2025-12 Active
```

Each row: click to edit or deactivate. "Source" links to the originating contract or quote.

**Add / Edit Contracted Price slide-over:**
- Product (searchable lookup)
- Currency (select)
- Unit Price (number)
- Effective Date
- Expiration Date (optional, with "No expiry" checkbox)
- Notes
- Source Contract / Quote (optional lookup, for audit trail)
- Save → immediately active in pricing waterfall for new quotes for this account

### 2. Admin: Global Contracted Prices List

At `/settings/cpq/contracted-prices`:

A table of ALL contracted prices across all accounts (useful for auditing commitments):

```
Filter by: Account | Product | Currency | Status (Active/Expired/All)

Account                  Product           Currency  Price        Expires         Status
Genome Diagnostics Ltd   PT Core           GBP       £27,500/yr   Dec 31, 2027    Active
Toronto General Hosp     PT Core           USD       $30,000/yr   (no expiry)     Active
NHS Highland             Full Platform     GBP       £55,000/yr   Dec 31, 2026    Active
Academic Medical Ctr     PT Core           USD       $28,000/yr   Jan 31, 2026    ⚠ Expiring soon
```

Export to CSV (for Finance review during annual pricing updates).

**Expiring Soon Alert:** Contracted prices expiring in < 90 days are flagged in yellow. Admin can be notified via email digest (configurable in TASK-116 notification settings).

### 3. Pricing Waterfall Integration (TASK-136)

In the 10-step pricing waterfall, Step 5 is "Contracted Price Lookup":

```typescript
// In PricingEngineService — Step 5
async step5ContractedPrice(context: PriceWaterfallContext): Promise<void> {
  const contractedPrice = await this.contractedPriceRepo.findActive({
    accountId: context.quote.accountId,
    productId: context.line.productId,
    currency: context.quote.currency,
    asOf: context.quote.quoteDate ?? new Date(),
  });

  if (contractedPrice) {
    context.line.contractedNetPrice = contractedPrice.contractedUnitPrice;
    context.line.priceSource = 'ContractedPrice';
    context.line.contractedPriceId = contractedPrice.id;
    // Step 5 sets the floor for steps 6 onwards
    // Manual discounts at step 6 CAN still go below contracted price (with approval trigger)
  }
}
```

**Price Waterfall snapshot** (stored on `QuoteLine.priceWaterfallSnapshot`) includes the contracted price applied:

```json
{
  "step1_listPrice": 34999,
  "step2_configPrice": 34999,
  "step3_discountSchedule": 31499,
  "step4_priceRule": 31499,
  "step5_contractedPrice": 27500,
  "step5_contractedPriceId": "cp_abc123",
  "step6_manualDiscount": 27500,
  "step10_lineTotal": 27500
}
```

### 4. Quote Line Display — Contracted Price Indicator

In the Quote Line Editor (TASK-128), when a contracted price is active for a line:

```
PT Core — Platform Fee
List price: £34,999/yr
✓ Contracted price applied: £27,500/yr (expires Dec 31, 2027)
[Override →] (requires Deal Desk permission; triggers approval)
```

The contracted price is shown in green. The "Override" link lets a Deal Desk user set a lower price, which triggers the standard manual discount approval flow.

Reps (without Deal Desk permission) cannot see the "Override" link — they see the contracted price as a fixed floor.

### 5. Auto-Lock on Contract Activation (Optional)

Global CPQ Settings toggle: **"Auto-create Contracted Prices when contract is activated"** (default: OFF).

When ON:
- On `Order → Active` transition, for each subscription line, the system creates a `ContractedPrice` record:
  - `accountId` = contract account
  - `productId` = subscription product
  - `contractedUnitPrice` = subscription's `contractedNetPrice`
  - `effectiveDate` = contract start date
  - `expirationDate` = contract end date
  - `sourceContractId` = the newly activated contract

This ensures renewal quotes automatically pick up the locked price without manual re-entry.

### 6. Contracted Prices in Renewal Flow (TASK-134)

When generating a renewal quote:
1. Pricing waterfall runs for each renewal line
2. If a `ContractedPrice` exists and has not expired (or admin has applied the new renewal pricing mode), it is applied at Step 5
3. If the pricing mode is "New List Price" (admin-configured per renewal rule), Step 5 is bypassed for renewal quotes
4. A "Contracted Price has expired for this renewal" warning appears in the renewal quote UI if the price falls back to list

---

## Definition of Success

- [ ] A contracted price for Genome Diagnostics / PT Core / GBP is applied correctly in a new quote for that account
- [ ] The price waterfall snapshot shows `step5_contractedPrice: 27500` for the affected line
- [ ] A price book change to PT Core's list price does NOT affect the contracted price quote for Genome Diagnostics
- [ ] An expired contracted price falls back to standard pricing without error
- [ ] Auto-lock on activation creates `ContractedPrice` records matching the finalized line prices
- [ ] The "Expiring soon" alert appears for prices expiring in < 90 days
- [ ] Renewal quote for an account with an expired contracted price shows the warning

---

## Method to Complete

### Backend
1. `ContractedPrice` entity and repository with `findActive({ accountId, productId, currency, asOf })` method
2. `ContractedPriceService` — CRUD + expiration query + auto-lock-on-activation
3. Integrate into `PricingEngineService.step5ContractedPrice()` (TASK-136)
4. `ContractedPriceController` — REST endpoints
5. Cron: `ContractedPriceExpiryAlertJob` — weekly digest of prices expiring in 90 days

### Frontend
1. Account record: "Contracted Prices" tab (or section in account detail)
2. `ContractedPricesAdminPage.tsx` — global list at `/settings/cpq/contracted-prices`
3. `ContractedPriceSlideOver.tsx` — add/edit form
4. Update `QuoteLineEditor.tsx` — contracted price indicator + override link (permission-gated)
5. Update `RenewalQuoteForm.tsx` — expired contracted price warning
6. Update `GlobalCpqSettingsPage.tsx` — "Auto-create Contracted Prices" toggle

---

## Acceptance Criteria

- AC1: Contracted price is correctly applied at step 5 of the waterfall for an account with a matching record
- AC2: `priceWaterfallSnapshot.step5_contractedPrice` contains the contracted unit price for affected lines
- AC3: After list price update in price book, the contracted account still quotes at the contracted price
- AC4: `expirationDate` past → step 5 returns no match; line falls through to manual discount step
- AC5: Auto-lock toggle ON + contract activation → `ContractedPrice` records created for all subscription lines
- AC6: Quote line editor shows the "Contracted price applied" badge for affected lines

---

## Dependencies

- TASK-118 (Price Books) — contracted price sits above price book in the waterfall
- TASK-119 (Discount Schedules) — contracted price sits below discount schedule in the waterfall
- TASK-128 (Quote Line Editor) — contracted price indicator shown on each line
- TASK-132 (Quote-to-Contract) — auto-lock hook fires on contract activation
- TASK-134 (Renewal Queue) — renewal pricing checks contracted price expiration
- TASK-136 (Pricing Engine) — Step 5 implementation

---

## Estimated Effort
**Backend:** 2 days | **Frontend:** 2 days | **Testing:** 0.5 day
**Total:** 4.5 days
