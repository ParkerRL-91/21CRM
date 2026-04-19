# TASK-136 — Backend: Pricing Engine — Calculation Service
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Every CPQ calculation depends on this

---

## User Story

**As a** CPQ system,
**I need** a reliable, deterministic pricing engine that processes the full discount waterfall for every quote line in the correct sequence — list price → volume discounts → price rules → contracted prices → proration → rollup — with results available in < 1 second,
**so that** quote totals are always accurate, reproducible, and consistent with the configured pricing rules.

---

## Background & Context

The pricing engine is the computational core of CPQ. It is called:
- On every line quantity or discount change
- On quote save
- On product addition or removal
- When admin changes a price rule
- During approval evaluation

It must be:
- **Deterministic**: same inputs → always same outputs (critical for audit/legal)
- **Fast**: < 500ms for a typical 10-line quote
- **Correct**: implements the full 10-step waterfall in the correct sequence
- **Auditable**: stores the full waterfall result per line (not just the net price)

---

## The Pricing Waterfall (10-Step Pipeline)

Execute in this exact order for each quote line:

```
STEP 1: INITIALIZE
  - Load quote header (currency, start date, term, price book)
  - Load product record (list price from price book entry, billing type, subscription type)
  - Initialize PriceWaterfall record for this line

STEP 2: CONFIGURATION PRICING
  - If product.configType = Block: look up block price tier for this quantity
  - Set initialPrice = block price or list price from price book
  - Stamp listPrice on the QuoteLine

STEP 3: DISCOUNT SCHEDULE (Volume/Slab)
  - If product has a volume discount schedule:
    a. Determine effective quantity (per line, or aggregated across lines if CrossProducts = true)
    b. Find matching tier (Range: find the single tier the quantity falls in; Slab: find all applicable bands)
    c. Range: apply discount % to entire quantity
    d. Slab: apply each band's discount % to units in that band; compute blended effective discount
  - If product has a term discount schedule:
    a. Find matching tier based on quote.subscriptionTerm
    b. Apply term discount % to the price
  - Set customerPrice = listPrice × (1 - customerDiscount%)

STEP 4: PRICE RULE EVALUATION
  - Load all active price rules in EvaluationOrder sequence
  - For each rule:
    a. Evaluate all Price Conditions (field comparison, aggregate variable comparison)
    b. If conditions met (AND/OR logic): execute Price Actions
       - Static value: set target field directly
       - Field value: copy another field value
       - Summary variable: use pre-computed aggregate
       - Formula: evaluate expression
  - Price rules can modify: listPrice, customerDiscount, additionalDiscount, specialPrice, billingFrequency, etc.
  - Re-stamp affected price fields after each rule set executes

STEP 5: CONTRACTED PRICE CHECK
  - Check if a Contracted Price exists for this Account + Product combination
  - If found: set specialPrice = contracted price; set specialPriceType = Contracted
  - Contracted prices override all prior discounting

STEP 6: MANUAL DISCOUNT / SPECIAL PRICE
  - If rep has set QuoteLine.Discount: apply as additionalDiscount
  - If rep has set QuoteLine.SpecialPrice: use as netPrice directly (bypasses discount calculation)
  - Validate: if netPrice < product.floorPrice: flag FLOOR_PRICE_VIOLATION (warning, not error)
  - Validate: if additionalDiscount > product.maxManualDiscount: flag MAX_DISCOUNT_EXCEEDED (warning)

STEP 7: PARTNER / DISTRIBUTOR DISCOUNTS
  - If Quote.partnerDiscount > 0: apply partner discount after customer price
  - If Quote.distributorDiscount > 0: apply distributor discount after partner price
  - These are quote-level percentage discounts applied to the net price before proration

STEP 8: PRORATION
  - Calculate effectiveTerm:
    - Standard: quote.subscriptionTerm
    - Amendment: (contractEndDate - amendmentStartDate) in months
    - Partial start (custom start date on line): remaining months in billing period
  - prorateMultiplier = effectiveTerm / product.subscriptionTerm
  - For annual products (subscriptionTerm = 12): multiplier = months/12
  - For one-time products: multiplier = 1.0 always

STEP 9: LINE TOTAL CALCULATION
  - netUnitPrice = specialPrice OR (listPrice × combined discount multiplier)
  - lineTotal = netUnitPrice × quantity × prorateMultiplier
  - MRR = lineTotal / 12 (for annual subscriptions); = lineTotal for monthly; = 0 for one-time
  - ARR = lineTotal (for annual); = lineTotal × 12 (for monthly)

STEP 10: ROLLUP TO QUOTE
  - After all lines are calculated, roll up to quote level:
    - subtotal = sum(listPrice × quantity) for all lines
    - totalDiscount = subtotal - sum(netTotal)
    - netRecurringTotal = sum(netTotal for recurring lines)
    - oneTimeTotal = sum(netTotal for one-time lines)
    - grossTotal = netRecurringTotal + oneTimeTotal
  - Call TaxCalculationService.calculate(quote) → taxTotal
  - grandTotal = grossTotal + taxTotal
  - MRR = netRecurringTotal / 12 (for annual billing)
  - ARR = netRecurringTotal
  - Store all rolled-up totals on Quote entity
  - Calculate approvalVariables (MaxLineDiscount, TotalARR, HasPSProduct, etc.)
```

---

## Features Required

### 1. PricingEngineService

Central service class:

```typescript
class PricingEngineService {
  // Entry point: calculate all lines for a quote
  async calculateQuote(quoteId: string): Promise<QuoteCalculationResult>

  // Calculate a single line (for real-time preview)
  async calculateLine(lineId: string, overrides?: LineOverrides): Promise<LineCalculationResult>

  // Simulate calculation without persisting (for preview/testing)
  async simulateQuote(quoteId: string, hypotheticalChanges?: LineChange[]): Promise<QuoteCalculationResult>

  // Calculate amendment proration
  async calculateAmendmentProration(contractId: string, effectiveDate: Date, changedLines: LineChange[]): Promise<ProratedAmendmentResult>
}
```

### 2. Price Waterfall Record

Per line, store the full waterfall as a JSON snapshot:

```typescript
type PriceWaterfall = {
  listPrice: number;
  // Step 3
  discountScheduleApplied: string | null; // schedule name
  discountScheduleType: 'Range' | 'Slab' | null;
  customerDiscountPercent: number;
  customerPrice: number;
  // Step 4
  priceRulesApplied: Array<{ ruleName: string; action: string; newValue: number }>;
  priceAfterRules: number;
  // Step 5
  contractedPriceApplied: boolean;
  contractedPrice: number | null;
  // Step 6
  manualDiscountPercent: number;
  specialPrice: number | null;
  floorPriceViolation: boolean;
  maxDiscountExceeded: boolean;
  // Step 7
  partnerDiscountPercent: number;
  distributorDiscountPercent: number;
  netUnitPrice: number;
  // Step 8
  effectiveTerm: number;
  prorateMultiplier: number;
  // Step 9
  quantity: number;
  lineNetTotal: number;
  lineMRR: number;
  lineARR: number;
};
```

This is stored in `QuoteLine.priceWaterfallSnapshot` (JSONB) and used to render the per-line price waterfall UI.

### 3. Summary Variables

Before price rules run, compute all configured `SummaryVariable` aggregates:

```typescript
async computeSummaryVariables(quoteId: string): Promise<Record<string, number>> {
  // For each SummaryVariable:
  // - Filter lines by filterField/filterValue
  // - Apply aggregate function (Sum, Max, Min, Count, Average) to sourceField
  // Return map: { MaxLineDiscount: 0.22, TotalARR: 111997, ... }
}
```

Summary variables are available during price rule condition evaluation.

### 4. Caching & Performance

- Discount schedules and price rules are cached in Redis with a TTL of 5 minutes
- Price book entries are cached per workspace per price book
- On admin changes to rules/schedules/price books: cache is invalidated for that workspace
- Quote calculation is idempotent: running twice with same inputs = same outputs

### 5. Concurrency

- Quote lines are calculated sequentially (later rules may depend on earlier line totals via summary variables)
- Multiple simultaneous saves on the same quote are serialized via a per-quote Redis lock (or DB-level row lock)
- Timeout: 10 seconds maximum for any quote calculation; if exceeded, returns error

### 6. Calculation Trigger Points

- `QuoteLineService.addLine()` → triggers full quote calculation
- `QuoteLineService.updateLine()` → triggers full quote calculation
- `QuoteLineService.removeLine()` → triggers full quote calculation
- `QuoteService.save()` (on any header field change) → triggers full quote calculation
- `PriceRuleService.activate()` → invalidates cache; does NOT retroactively recalculate existing quotes
- `POST /cpq/quotes/:id/recalculate` → explicit recalculate trigger (for admin use)

### 7. Calculation Result Format

```typescript
type QuoteCalculationResult = {
  quoteId: string;
  calculatedAt: Date;
  lines: LineCalculationResult[];
  totals: {
    subtotal: number;
    totalDiscount: number;
    discountPercent: number;
    netRecurringTotal: number;
    oneTimeTotal: number;
    taxTotal: number;
    grandTotal: number;
    mrr: number;
    arr: number;
  };
  approvalVariables: Record<string, number>;
  warnings: Array<{ lineId: string; type: 'FLOOR_PRICE_VIOLATION' | 'MAX_DISCOUNT_EXCEEDED'; details: string }>;
  errors: Array<{ lineId: string; type: string; message: string }>;
};
```

---

## Definition of Success

- [ ] A 10-line quote with volume discounts, 2 price rules, and proration calculates correctly in < 500ms
- [ ] Slab discount: 25 units → first 10 at 0%, next 15 at 10% (not all 25 at 10%)
- [ ] Range discount: 25 units → all 25 at 10% (tier lookup)
- [ ] Price rule that fires on Account.Type = Academic correctly sets CustomerDiscount = 15%
- [ ] Contracted price overrides all prior discounting when found for the account + product
- [ ] Proration multiplier = 8/12 for a 12-month product added 4 months into a 12-month contract
- [ ] Summary variable `MaxLineDiscount` = 0.22 when the highest line discount is 22%
- [ ] Calculation is idempotent (running 3 times = same result each time)
- [ ] Cache invalidation fires when a price rule is activated/deactivated

---

## Method to Complete

### Backend
1. `PricingEngineService` (class) — implements the 10-step waterfall
2. `DiscountScheduleResolver` — handles Range vs. Slab tier lookup
3. `PriceRuleEvaluator` — condition checking + action execution
4. `SummaryVariableAggregator` — computes all summary variables
5. `ProrationCalculator` — prorate multiplier + amendment co-termination
6. `TaxCalculationBridge` — calls TaxService (TASK-123) or external provider (TASK-125)
7. `CalculationCacheService` — Redis cache for discount schedules, rules, price book entries
8. Route: `POST /cpq/quotes/:id/recalculate` (explicit trigger)
9. Unit tests covering each of the 10 steps independently
10. Integration tests covering full quote calculations with all features active

---

## Acceptance Criteria

- AC1: Step 3 — Slab discount produces different per-unit prices for each quantity band
- AC2: Step 3 — Range discount applies one uniform rate to all units based on total quantity
- AC3: Step 4 — Price rules with AND conditions: all must pass; OR conditions: any one passing fires the rule
- AC4: Step 5 — Contracted price found: overrides customer price; waterfall shows "Contracted: $X"
- AC5: Step 6 — Manual discount > maxManualDiscount: warning returned in result but calculation continues
- AC6: Step 8 — One-time product: prorateMultiplier = 1.0 always
- AC7: Step 10 — Rollup totals match sum of individual line net totals
- AC8: Performance: 10-line quote with 5 active rules calculates in < 500ms (p95)

---

## Dependencies

- TASK-117 (Product Catalog) — product records, pricing config
- TASK-118 (Price Books) — price book entry lookup
- TASK-119 (Discount Schedules) — schedule + tier data
- TASK-120 (Price Rules) — rules evaluated in this engine
- TASK-123 (Tax Config) — tax calculation delegated here

---

## Estimated Effort
**Backend:** 8 days | **Testing:** 3 days
**Total:** 11 days
