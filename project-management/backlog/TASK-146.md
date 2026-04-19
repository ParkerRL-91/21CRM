# TASK-146 — Admin: Currency & Exchange Rate Management
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Required for multi-currency quoting to function correctly

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** to manage exchange rates centrally with effective dates and auto-expiration,
**so that** all USD/GBP/EUR quotes use consistent, auditable rates and our ARR analytics can be rolled up into a single normalized currency view.

---

## Background & Context

PhenoTips sells in USD and GBP today, with EUR deals emerging. Without centralized rate management:
- Each rep improvises rates at quote time, creating ARR inconsistencies in reporting
- Historical quotes at old rates can't be accurately compared in analytics
- Finance has no audit trail for which rate was applied to which deal

This task adds the `ExchangeRate` entity, an admin management screen, a "Convert at current rate" utility in the Price Book editor, and a normalized USD display field on contracts for analytics rollup.

---

## Data Model

### `ExchangeRate` Entity

```typescript
type ExchangeRate = {
  id: string;
  baseCurrency: CurrencyCode;        // 'USD' — the source currency (always the workspace default)
  targetCurrency: CurrencyCode;      // 'GBP' | 'EUR' | 'CAD' | etc.
  rate: number;                      // e.g. 0.7912 (1 USD = 0.7912 GBP)
  effectiveDate: Date;               // Rate applies starting this date
  expirationDate: Date | null;       // null = still active; system sets when a newer rate is saved
  source: 'Manual' | 'Auto';        // Manual = admin-entered; Auto = fetched from external API
  createdBy: string;                 // userId
  createdAt: Date;
  notes: string | null;              // e.g. "Q2 2026 planning rate approved by CFO"
};
```

**Key rules:**
- Only one `ExchangeRate` per `(baseCurrency, targetCurrency)` pair may have `expirationDate = null` (the "active" rate)
- When a new rate is saved for a pair, the previous active rate is auto-expired (`expirationDate = effectiveDate` of the new record)
- Rates are immutable after creation (append-only log); corrections create a new record
- The `ExchangeRate` for (USD→GBP) is used when a quote in GBP has no explicit price book entry for a line item, or when analytics normalizes GBP ARR to USD

### Contract Entity — New Fields

```typescript
// Added to existing Contract entity (TASK-139)
type ContractCurrencyFields = {
  quoteExchangeRate: number | null;       // Rate snapshot at time of contract activation
  normalizedARRUsd: number | null;        // contractARR ÷ quoteExchangeRate (for analytics)
  normalizedCurrency: 'USD';             // Always USD — the normalization target
};
```

**Why snapshot the rate at contract activation?** The contracted ARR in GBP must be comparable across periods in analytics. Snapshotting the rate at activation means we always know what the deal was worth in USD at the time it was signed, even if rates drift later.

---

## Features Required

### 1. Exchange Rate Admin Screen

Located at `/settings/cpq/exchange-rates`

**Rate List Table:**

```
Currency Pair    Current Rate    Effective Date    Last Updated    Source    Actions
USD → GBP        0.7912          Apr 1, 2026        Apr 1, 2026     Manual    [Edit] [History]
USD → EUR        0.9215          Mar 15, 2026       Mar 15, 2026    Manual    [Edit] [History]
USD → CAD        1.3480          Apr 1, 2026        Apr 1, 2026     Manual    [Edit] [History]
```

**Add New Rate** button opens a slide-over:
- Target Currency (select from ISO 4217 list)
- Rate (number, 4 decimal places)
- Effective Date (date picker, defaults to today)
- Notes (optional)
- "Save Rate" — expires the previous active rate for this pair and activates the new one

**Rate History modal:** Full immutable log of all historical rates for a currency pair, sorted newest → oldest. Columns: Rate, Effective Date, Expiration Date, Source, Created By.

### 2. Active Currencies Setting

In Global CPQ Settings (TASK-116), a new field:

**Active Quote Currencies:** Multi-select of ISO 4217 codes (e.g., USD, GBP, EUR). Only currencies in this list appear in the "Quote Currency" dropdown when creating a quote.

At least one exchange rate must exist for each active non-base currency. A warning badge appears on the Exchange Rate screen if any active currency is missing a rate.

### 3. Rate Auto-Fetch (Optional / Phase 2)

Admin toggle: "Auto-fetch rates from Open Exchange Rates API (daily)." If enabled:
- Requires API key in Integration Settings (TASK-125)
- Nightly job fetches rates for all active currencies
- Saves new `ExchangeRate` records with `source: 'Auto'`
- Admin can override by saving a Manual rate (Manual rates take precedence until they expire)
- Manual override is visually indicated in the rate list

### 4. "Convert at Current Rate" in Price Book Editor

In the Price Book entry editor (TASK-118), when a product has a USD list price but no GBP entry:

```
⚠ No GBP price set for this product.
  USD list price: $34,999/yr
  Convert at current rate (0.7912): £27,688/yr   [Apply]
  Or enter manually: [_________]
```

The "Apply" button pre-fills the GBP price field with the converted value. The rep/admin can still edit before saving.

This utility appears whenever a price book entry is viewed for a non-base currency product that has a corresponding base-currency entry in the same or Standard price book.

### 5. Analytics Normalization (Feeds TASK-143)

When the Analytics Service calculates ARR waterfall or MRR trends:

```typescript
// In ARRWaterfallCalculator
async normalizeToUSD(contract: Contract): Promise<number> {
  if (contract.currency === 'USD') return contract.arr;

  // Use the snapshotted rate from contract activation (preferred)
  if (contract.quoteExchangeRate) {
    return contract.arr / contract.quoteExchangeRate;
  }

  // Fallback: current active rate
  const rate = await this.exchangeRateService.getActiveRate('USD', contract.currency);
  return contract.arr / rate.rate;
}
```

The ARR waterfall in TASK-143 gains a "View in: [Local Currency] | [USD (normalized)]" toggle. When toggled to USD, all values use `normalizedARRUsd`.

### 6. Quote Exchange Rate Display

On the Quote Summary Panel (TASK-129), when the quote currency ≠ workspace default:

```
Quote Currency: GBP
Exchange Rate: 1 USD = 0.7912 GBP  (as of Apr 1, 2026)
Normalized ARR (USD): $44,236 / yr
```

This is informational only — the quote operates in GBP.

---

## Definition of Success

- [ ] Admin can set the active GBP rate to 0.7912; the previous rate is auto-expired
- [ ] Historical rate log shows the full append-only audit trail
- [ ] A new GBP quote automatically displays the active rate on the summary panel
- [ ] Contract activation snapshots `quoteExchangeRate` and computes `normalizedARRUsd`
- [ ] Analytics ARR waterfall correctly shows USD-normalized totals across USD + GBP contracts
- [ ] "Convert at current rate" pre-fills a GBP price book entry correctly
- [ ] Warning shown on Exchange Rate screen if any active currency has no rate

---

## Method to Complete

### Backend
1. `ExchangeRate` entity and repository
2. `ExchangeRateService` — `getActiveRate(base, target)`, `setRate(dto)` (auto-expires previous), `getRateHistory(base, target)`
3. Add `quoteExchangeRate`, `normalizedARRUsd` to `Contract` entity; populate in `ContractService.activateOrder()` (TASK-139)
4. `ExchangeRateController` — CRUD endpoints at `/settings/cpq/exchange-rates`
5. (Phase 2) `ExchangeRateSyncJob` — BullMQ daily job fetching from Open Exchange Rates API
6. Seed: initial USD→GBP and USD→EUR rates added to TASK-144 Setup Wizard defaults

### Frontend
1. `ExchangeRateAdminPage.tsx` — rate list table + Add Rate slide-over + history modal
2. Update `GlobalCpqSettingsPage.tsx` — add Active Currencies multi-select
3. Update `PriceBookEntryEditor.tsx` — add "Convert at current rate" helper
4. Update `QuoteSummaryPanel.tsx` — show exchange rate + normalized ARR for non-base currencies
5. Update `ARRWaterfallChart.tsx` — USD normalization toggle (feeds from TASK-143)

---

## Acceptance Criteria

- AC1: Setting a new GBP rate automatically sets `expirationDate` on the previous GBP rate
- AC2: Rate history modal shows all previous rates in descending order with expiration dates
- AC3: Contract activated in GBP: `quoteExchangeRate = 0.7912`, `normalizedARRUsd = contract.arr / 0.7912`
- AC4: ARR waterfall with USD normalization enabled: GBP contracts show USD-equivalent values
- AC5: "Convert at current rate" button produces correct GBP price (USD price × active rate)
- AC6: Warning badge on Exchange Rate page when an active currency has no rate configured

---

## Dependencies

- TASK-116 (Global Settings) — Active Currencies setting lives here
- TASK-118 (Price Books) — "Convert at current rate" helper added to price book editor
- TASK-126 (Quote Builder) — Quote Currency field validated against active currencies
- TASK-129 (Quote Summary Panel) — rate display added
- TASK-139 (Contract Lifecycle) — `quoteExchangeRate`, `normalizedARRUsd` fields added to Contract
- TASK-143 (Analytics) — USD normalization toggle in ARR waterfall

---

## Estimated Effort
**Backend:** 2 days | **Frontend:** 2 days | **Testing:** 0.5 day
**Total:** 4.5 days
