# TASK-149 — Multi-Dimensional Quoting & Per-Year Pricing Grid
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Required for multi-year enterprise deals; affects Quote Line Editor, Pricing Engine, PDF generation

---

## User Story

**As a** sales rep at PhenoTips,
**I want** to set a different list price, discount, and net price for each year of a multi-year deal on a per-line-item basis,
**so that** I can reflect annual price uplifts, ramp pricing, and year-specific negotiated rates in a single quote rather than creating separate one-year quotes.

**As a** Revenue Operations admin,
**I want** to configure default year-over-year uplift percentages that auto-populate the pricing grid for multi-year quotes,
**so that** reps start from the correct baseline and don't have to manually calculate each year's prices from scratch.

---

## Background & Context

Enterprise deals at PhenoTips are increasingly multi-year (2–3 year terms). In a flat-pricing model, the same price applies across all years — which hides the economic reality. Customers increasingly expect to see:
- Year 1: negotiated price (potentially discounted from list)
- Year 2: 5% uplift from Year 1
- Year 3: 5% uplift from Year 2

Without per-year pricing in the quote:
- Reps cannot represent committed pricing changes per year
- Customers get a vague "3-year deal" with no per-year breakdown
- Finance cannot book revenue correctly across periods
- PDF documents show only Year 1 pricing, misleading the customer

This task adds a **Per-Year Pricing Grid** to each quote line item, with UI controls in the Quote Line Editor and a Multi-Year Pricing Table section in generated documents.

---

## Data Model Changes

### `quoteLineItem` — New Fields

Add to the existing `quoteLineItem` object (extend `cpq-setup.service.ts`):

```typescript
// New fields added to CPQ_FIELDS.quoteLineItem
{
  name: 'termYears',
  label: 'Term (Years)',
  type: FieldMetadataType.NUMBER,
  description: 'Number of contract years; drives the pricing grid rows (1–5)',
},
{
  name: 'yearlyPricing',
  label: 'Yearly Pricing',
  type: FieldMetadataType.RAW_JSON,
  description: 'Per-year pricing grid: [{year, listPrice, discountPercent, netUnitPrice, netTotal}]',
},
{
  name: 'pricingMode',
  label: 'Pricing Mode',
  type: FieldMetadataType.SELECT,
  defaultValue: "'flat'",
  options: [
    { label: 'Flat (same each year)', value: 'flat', color: 'gray', position: 0 },
    { label: 'Ramp (per-year pricing)', value: 'ramp', color: 'blue', position: 1 },
  ],
},
{
  name: 'totalContractValue',
  label: 'Total Contract Value',
  type: FieldMetadataType.CURRENCY,
  description: 'Sum of netTotal across all years (only meaningful in ramp mode)',
},
```

### `yearlyPricing` JSON Schema

```typescript
type YearlyPricingEntry = {
  year: number;                   // 1, 2, 3, 4, 5
  listPrice: number;              // List price for this year (in quote currency)
  discountPercent: number;        // Discount % applied to list price
  netUnitPrice: number;           // listPrice × (1 - discountPercent / 100)
  netTotal: number;               // netUnitPrice × quantity
  upliftFromPrevious: number;     // % uplift vs. previous year (informational)
  priceSource: string;            // 'list' | 'contracted' | 'manual' | 'ramp'
  notes: string | null;           // Optional per-year note (e.g., "includes NLP setup")
};

type YearlyPricing = YearlyPricingEntry[];  // Array, index 0 = Year 1
```

### `quote` — New Fields

```typescript
{
  name: 'termYears',
  label: 'Term (Years)',
  type: FieldMetadataType.NUMBER,
  description: 'Quote-level term in years; controls pricing grid depth for all lines',
},
{
  name: 'totalContractValue',
  label: 'Total Contract Value (TCV)',
  type: FieldMetadataType.CURRENCY,
  description: 'Sum of all line items across all years',
},
{
  name: 'averageAnnualValue',
  label: 'Average Annual Value (AAV)',
  type: FieldMetadataType.CURRENCY,
  description: 'TCV ÷ termYears; comparable ARR for multi-year deals',
},
```

---

## Features Required

### 1. Quote-Level Term Setting

On the New Quote modal (TASK-126) and Quote Header, `subscriptionTermMonths` is already stored. Add a computed `termYears` field:

- 12 months → 1 year → single-row pricing grid
- 24 months → 2 years → 2-row grid
- 36 months → 3 years → 3-row grid (most common for PhenoTips enterprise)
- Support up to 60 months / 5 years

Admin can configure maximum term years in Global CPQ Settings.

### 2. Pricing Mode Toggle on Each Line

In the Quote Line Editor (TASK-128), each line has a **Pricing Mode** toggle:

```
[Flat pricing]  [Ramp pricing]
```

- **Flat pricing** (default): same price across all years. Behaves like current implementation. `yearlyPricing` is populated but all rows are identical.
- **Ramp pricing**: each year is independently editable. Pricing grid appears.

### 3. Per-Year Pricing Grid

When `pricingMode = 'ramp'` (or when the term > 1 year even in flat mode, to show the breakdown), the line item expands to show a grid:

```
PT Core — Platform Fee                     Qty: 1   Mode: [Ramp ▾]
─────────────────────────────────────────────────────────────────────────
       List Price    Discount %   Net Unit Price   Net Total     Notes
Year 1  £34,999/yr      10%          £31,499/yr    £31,499/yr   [     ]
Year 2  £36,749/yr       8%          £33,809/yr    £33,809/yr   [     ]
Year 3  £38,586/yr       5%          £36,657/yr    £36,657/yr   [     ]
─────────────────────────────────────────────────────────────────────────
TCV:                               £101,965
AAV:                                £33,988/yr
─────────────────────────────────────────────────────────────────────────
```

**Grid behavior:**
- List Price is editable per row (allows true per-year list price variation)
- Discount % is editable per row (allows different discount per year)
- Net Unit Price auto-calculates from List Price × (1 - Discount %) but can be overridden
- Net Total = Net Unit Price × Quantity
- Changing Quantity (above the grid) updates all Net Total cells
- Year 2+ rows auto-populate with the previous year's net price × (1 + default uplift %)
- Default uplift % is pulled from Global CPQ Settings (TASK-116, typically 5%)

**Auto-populate rules:**
1. When the rep adds a line in ramp mode, Year 1 is priced from the pricing waterfall (all 10 steps)
2. Year 2 = Year 1 Net Price × (1 + upliftPercent)
3. Year 3 = Year 2 Net Price × (1 + upliftPercent)
4. Rep can override any cell after auto-population

**Override indicator:**
- Any cell manually overridden is shown with a subtle underline or blue dot
- "Reset to auto-calculated" link restores the auto-calculated value

### 4. Quote Summary Updates (TASK-129)

The Quote Summary Panel adds multi-year awareness:

```
Quote Summary — 3-Year Ramp Deal
─────────────────────────────────────────────────────
                Year 1      Year 2      Year 3
Subtotal:      £55,997     £58,797     £70,157
Discount:       -£5,600     -£4,699     -£3,508
Net Total:     £50,397     £54,098     £66,649

Total Contract Value (TCV): £171,144
Average Annual Value (AAV):  £57,048
─────────────────────────────────────────────────────
ARR (Year 1): £50,397     ARR (Year 3): £66,649
```

Also shows: quote-level ARR is `Year 1 Net Total` (the committed first-year value for pipeline purposes).

### 5. Flat Mode (Single-Year Display)

For 1-year quotes or lines in flat mode:
- The pricing grid is still calculated and stored in `yearlyPricing` (with 1 row)
- The grid is NOT shown visually — the line item shows the flat price fields as before
- This preserves backward compatibility

For multi-year flat quotes:
- The grid shows N identical rows
- Rep can see "You are pricing £50,000/yr for 3 years (TCV: £150,000)"
- Grid is shown but all rows are auto-locked to the same value unless toggled to ramp

### 6. Bulk Year Operations

In the Quote Line Editor, above the pricing grid:

```
Apply to all years:  [Set discount: ___% to all years]  [Apply 5% uplift per year]  [Reset all to flat]
```

- "Set discount" applies the entered % to all years in this line's grid
- "Apply uplift" recalculates Year 2+ using the entered uplift % from Year 1
- "Reset to flat" copies Year 1 to all rows

### 7. PDF Multi-Year Pricing Table (TASK-138)

In the generated quote document, a new section type: **Multi-Year Pricing Table**

```
PRODUCT PRICING SUMMARY — 3-YEAR TERM

Product                  Y1 Annual Price  Y2 Annual Price  Y3 Annual Price
PT Core                    £31,499            £33,809          £36,657
PPQ Module                 £10,800            £11,340          £11,907
CRAT Module                £8,500             £8,925           £9,371
SSO Integration            £5,500             £5,775           £6,064
─────────────────────────────────────────────────────────────────────────
Subtotal                   £56,299            £59,849          £63,999
────────────────────────────────────────────────────────────────────────
Total Contract Value (TCV): £180,147
Average Annual Value (AAV):  £60,049
────────────────────────────────────────────────────────────────────────
```

If `pricingMode = 'flat'` for all lines, the single-column pricing table is shown (no per-year breakdown). Template admin can configure which view to use.

### 8. Quick Quote Compatibility (TASK-145)

In Quick Quote, term-based pricing auto-populates:
- If term = 12 months, flat pricing, single grid row
- If term = 24 or 36 months, flat pricing by default; rep can toggle individual lines to ramp

The Quick Quote form adds: "Apply 5% annual uplift to all lines?" toggle (default: off). When on, auto-generates ramp pricing.

### 9. Pricing Engine (TASK-136)

The 10-step waterfall runs per year:
- For Year 1: standard waterfall (all 10 steps)
- For Year N > 1: `previousYearNet × (1 + upliftRate)` as the starting value; steps 5–10 still apply if the rep overrides
- Result stored in `yearlyPricing[N-1]`

```typescript
async calculateYearlyPricing(
  context: PriceWaterfallContext,
  termYears: number,
  upliftPercent: number,
): Promise<YearlyPricingEntry[]> {
  const entries: YearlyPricingEntry[] = [];

  // Year 1: full waterfall
  const year1 = await this.runFullWaterfall(context);
  entries.push({ year: 1, ...year1 });

  // Years 2+: uplift from previous year
  for (let y = 2; y <= termYears; y++) {
    const prev = entries[y - 2];
    const upliftedListPrice = prev.listPrice * (1 + upliftPercent / 100);
    const upliftedNetPrice = prev.netUnitPrice * (1 + upliftPercent / 100);
    entries.push({
      year: y,
      listPrice: upliftedListPrice,
      discountPercent: prev.discountPercent, // same % as Year 1 by default
      netUnitPrice: upliftedNetPrice,
      netTotal: upliftedNetPrice * context.line.quantity,
      upliftFromPrevious: upliftPercent,
      priceSource: 'ramp',
      notes: null,
    });
  }

  return entries;
}
```

---

## Definition of Success

- [ ] A 3-year quote line in ramp mode shows 3 independently editable rows (list price, discount %, net)
- [ ] Changing Year 2 discount does not affect Year 1 or Year 3
- [ ] Auto-populate fills Year 2 = Year 1 × 1.05 and Year 3 = Year 2 × 1.05 using the configured uplift
- [ ] Quote Summary shows per-year column totals and TCV/AAV
- [ ] Generated PDF shows the multi-year pricing table for ramp quotes
- [ ] Flat-mode (all years identical) shows correctly and is backward compatible
- [ ] Rep can switch a line from flat to ramp mid-editing without losing existing prices
- [ ] Pricing engine stores full `yearlyPricing` JSON on each quoteLineItem

---

## Method to Complete

### Backend
1. Add `termYears`, `yearlyPricing`, `pricingMode`, `totalContractValue` to `CPQ_FIELDS.quoteLineItem` in `cpq-setup.service.ts`
2. Add `termYears`, `totalContractValue`, `averageAnnualValue` to `CPQ_FIELDS.quote`
3. Update `CpqPricingService.calculateLinePrice()` to call `calculateYearlyPricing()` and store results
4. Update `CpqPricingService` to compute quote-level `totalContractValue` and `averageAnnualValue`
5. Generate instance migration for new fields

### Frontend
1. `YearlyPricingGrid.tsx` — per-line pricing grid with year rows, editable cells, uplift indicators
2. `PricingModeToggle.tsx` — flat vs. ramp toggle per line
3. Update `QuoteLineEditorRow.tsx` — conditionally render `YearlyPricingGrid` when ramp mode or term > 1
4. Update `QuoteSummaryPanel.tsx` — multi-year column breakdown + TCV + AAV
5. Update `QuickQuoteForm.tsx` — "Apply annual uplift" toggle
6. `useYearlyPricing` hook — computes and validates per-year pricing state

---

## Acceptance Criteria

- AC1: Switching a line to ramp mode with a 3-year term shows 3 editable rows
- AC2: Updating Year 2 discount to 7% only affects Year 2 net price; Year 1 and Year 3 unchanged
- AC3: "Apply 5% uplift per year" correctly calculates Year 2 = Year 1 × 1.05, Year 3 = Year 1 × 1.1025
- AC4: `quoteLineItem.yearlyPricing` JSON contains correct data for all 3 years after save
- AC5: Quote Summary shows TCV and per-year column breakdown
- AC6: Generated PDF multi-year table shows all 3 years with correct totals
- AC7: A 1-year flat quote behaves identically to the current implementation (no regression)

---

## Dependencies

- TASK-128 (Quote Line Editor) — primary UI host for the pricing grid
- TASK-129 (Quote Summary Panel) — multi-year summary display
- TASK-136 (Pricing Engine) — year-by-year calculation
- TASK-138 (PDF Generation) — multi-year pricing table section
- TASK-145 (Quick Quote) — uplift toggle in express lane
- `cpq-setup.service.ts` — new fields added here

---

## Estimated Effort
**Backend:** 2 days | **Frontend:** 4 days | **Testing:** 1 day
**Total:** 7 days
