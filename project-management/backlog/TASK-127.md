# TASK-127 — User: Product Configurator — Product Selector & Bundle Configurator
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Core of the quote flow; nothing is priced without this

---

## User Story

**As a** sales rep at PhenoTips,
**I want** a full-screen product selector where I can search and filter the PhenoTips catalog, add standard products and configure bundle offerings with guided options,
**so that** I can build accurate, complete deals in minutes rather than manually cross-referencing spreadsheets and making mistakes.

---

## Background & Context

The Product Configurator is the heart of the quote-building experience. It is where reps:
1. Browse the catalog filtered to their price book
2. Search by product name, family, or keyword
3. Add products to the quote with a quantity
4. Configure bundles (guided option selection with validation rules)
5. See real-time pricing as they add products

This screen is the most complex in the CPQ system. Getting it right directly impacts deal velocity. Industry benchmark: reps should be able to build a 5-line PhenoTips quote in under 3 minutes.

Reference UX: Salesforce CPQ's Quote Line Editor, but simplified for PhenoTips's catalog.

---

## Features Required

### 1. Quote Line Editor — Layout

**Full-page layout (not a modal):**
- URL: `/cpq/quotes/:id/lines`
- Breadcrumb: `Quotes > QTE-2026-0042 > Edit Lines`

**Split-pane layout:**
- **Left panel (40%):** Product Catalog Browser
- **Right panel (60%):** Current Quote Lines
- Both panels scroll independently
- **Bottom bar:** Sticky totals — Subtotal | Discount | Net Total | MRR | ARR | One-Time Total
- "Done Editing" button → returns to quote detail page, triggers final price calculation

### 2. Left Panel: Product Catalog Browser

**Search bar:** Full-text search across `name`, `sku`, `description`, `tags`

**Filters (collapsible left sidebar within the left panel):**
- Product Family (multi-select chips): PT Core / PPQ / CRAT / Add-Ons / Integrations / Professional Services
- Billing Type: Recurring / One-Time
- Region: US / UK / Global
- Show Inactive (admin toggle — hidden by default)

**Product cards in results grid:**
- Product Name (bold)
- SKU (monospace, small)
- Product Family (color-coded badge)
- List Price from current price book
- Billing Type badge
- "Add +" button (or quantity stepper if already added)
- For bundle products: "Configure" button (opens bundle configurator modal)

**Sort options:** Name A–Z | Price Low→High | Price High→Low | Most Recently Used

**"Recently Added" shelf:** top 5 products the rep has added to quotes in the past 30 days (personalized shortcut)

**"Favorites" list:** rep can star products to add to their favorites shortcut list

### 3. Bundle Configurator Modal

When rep clicks "Configure" on a bundle product, a modal opens showing the bundle structure:

**Bundle Configurator layout:**
- Title: "Configure [Bundle Name]"
- Feature sections (accordion, required features are auto-expanded):

  ```
  ▼ Core Platform [REQUIRED — 1 item]
  ✓ PhenoTips Core — Platform Fee        $34,999/yr  (locked, cannot deselect)
     Quantity: [1] (not editable for platform fee)

  ▼ Add-On Modules [OPTIONAL — select any]
  ☐ PPQ Module                           $12,999/yr  [+ Add]
  ☐ CRAT Module                          $9,999/yr   [+ Add] (disabled if PPQ not selected)

  ▼ Integrations [OPTIONAL — select at most 1]
  ⊙ SSO Integration                      $5,999/yr   (radio button — only one allowed)
  ⊙ HL7v2 Integration (Setup + Annual)
  ⊙ FHIR Integration (Setup + Annual)

  ▼ Professional Services [RECOMMENDED]
  ⚠ NLP Training Setup                   $15,000 one-time   [+ Add]
     Note: Recommended for first-time deployments
  ```

**Real-time validation:**
- Error messages appear inline below the affected option when a product rule fires
- Error example: "CRAT requires PPQ to be selected first"
- Alert example: "Multi-year deals typically include implementation services — consider adding NLP Training"
- Validation blocks "Add to Quote" until all errors are resolved; alerts are warnings only

**Sidebar (bundle summary):**
- Running bundle configuration total as options are added/removed
- Breakdown: Recurring: $X/yr | One-Time: $Y
- MRR: $Z

**"Add to Quote" button:** adds the configured bundle as a set of related line items to the quote

**Bundle option pricing:**
- Options with `isPriceIncludedInBundle = true` are marked "Included" with no price shown
- Options priced separately show their price per the active price book

### 4. Right Panel: Quote Lines

**Line item table:**

| # | Product | SKU | Qty | Start | End | List Price | Discount | Net Price | Line Total | Actions |
|---|---------|-----|-----|-------|-----|-----------|----------|-----------|------------|---------|

- Lines are sorted by Product Family (grouped) or by drag-to-reorder manual order
- Bundle child lines are indented under the bundle parent
- Optional products are marked with an (Optional) badge
- Required bundle components are locked (no delete, no discount)

**Inline editing per line:**
- Quantity (number input — triggers price recalculation)
- Discount % (number input — subject to `maxManualDiscount` from product and floor price)
- Start Date override per line (for partial-term lines)
- Line Notes (expandable text area — shown on quote document if "show line notes" template setting is on)

**Price waterfall per line (hover/expand):**
- List Price: $X
- Volume Discount (Schedule): -Y%
- Manual Discount: -Z%
- Prorate Multiplier: ×M
- Net Total: $A
- This makes the discount calculation transparent to the rep

**Line actions:**
- Delete line (confirmation if bundle parent — deletes all children)
- Duplicate line
- View product details (opens product detail panel in place)
- Move to group (if Quote Line Groups are enabled)

**Line totals grouping:**
- If `Group Lines By = Product Family`, show sub-total per family section
- Example:
  ```
  [PT Core]                                    $46,999/yr
  [Add-Ons]                                    $22,998/yr
  [Professional Services]                      $15,000 one-time
  ─────────────────────────────────────────────
  Subtotal:                                    $69,997/yr
  Discount:                                    -$2,998 (-4.3%)
  Net Total:                                   $66,999/yr
  MRR:                                         $5,583/mo
  ARR:                                         $66,999/yr
  ```

### 5. Real-Time Price Calculation

Every change to quantity, discount, or dates triggers recalculation:
- Debounced 500ms (not on every keystroke)
- Loading indicator per line during recalculation
- All totals update atomically (no partial state)
- Price rules fire automatically during recalculation
- If recalculation produces an error (floor price violated): highlight the line in red with an inline error

### 6. Guided Selling (optional phase)

Before the product catalog, a questionnaire filters products:
1. "What is the customer's primary use case?" (Rare Disease Diagnosis / Clinical Genomics / Research)
2. "Approximately how many users will access the system?" (< 10 / 11–50 / 51–100 / 100+)
3. "Does the customer require EHR integration?" (Yes / No)

Based on answers, the catalog is pre-filtered to relevant product families and a recommended configuration is suggested.

This is an optional phase — reps can skip and go directly to the full catalog.

---

## UX Requirements

- Product catalog search returns results in < 300ms
- Adding a product to the quote feels instant (optimistic UI before confirmation)
- Bundle configurator opens as an overlay — rep can see the quote lines behind it
- Keyboard shortcut: `⌘+K` opens product search from anywhere in the quote editor
- Drag-to-reorder lines (smooth animation, persists sort order)
- Keyboard navigation through the product catalog (arrow keys, Enter to add)
- Empty state: "No products added yet — search the catalog to begin"

---

## Definition of Success

- [ ] Rep can search "PT Core" and see the correct product with price from their price book in < 1s
- [ ] Rep can add PT Core + PPQ + SSO to a quote in under 2 minutes
- [ ] Bundle configurator: selecting CRAT without PPQ shows the validation error
- [ ] Changing quantity from 10 to 25 users triggers correct tier discount from discount schedule
- [ ] Price waterfall shows the correct breakdown of list → discount → net per line
- [ ] Totals update within 500ms of any change
- [ ] Quote lines persist correctly on page reload (no data loss)

---

## Method to Complete

### Backend
1. `QuoteLineService`:
   - `addLine(quoteId, productId, quantity)` — creates line, triggers initial calculation
   - `addBundleLines(quoteId, bundleConfig)` — adds parent + child lines from bundle configuration
   - `updateLine(lineId, updates)` — updates quantity/discount/dates, triggers recalculation
   - `removeLine(lineId)` — removes line + children if bundle; triggers recalculation
   - `reorderLines(quoteId, lineIds)` — reorders lines
2. `GET /cpq/quotes/:id/lines` — returns all lines with pricing detail
3. `POST /cpq/quotes/:id/lines` — add line
4. `PATCH /cpq/quotes/:id/lines/:lineId` — update line
5. `DELETE /cpq/quotes/:id/lines/:lineId` — remove line
6. `POST /cpq/quotes/:id/lines/reorder` — reorder
7. Product catalog endpoint: `GET /cpq/products?pricebook={id}&search={q}&family={f}` — returns products with this-pricebook prices

### Frontend
1. `QuoteLineEditorPage.tsx` — full-page split-pane layout
2. `ProductCatalogBrowser.tsx` — left panel with search + filters + product cards
3. `ProductCard.tsx` — individual product card
4. `BundleConfiguratorModal.tsx` — bundle configuration flow
5. `BundleFeatureSection.tsx` — accordion feature section
6. `BundleOptionRow.tsx` — individual option with checkbox, quantity, price
7. `QuoteLineTable.tsx` — right panel line item table
8. `QuoteLineRow.tsx` — individual line with inline edit
9. `PriceWaterfallPopover.tsx` — hover tooltip showing price breakdown
10. `QuoteTotalsBar.tsx` — sticky bottom totals
11. `GuidedSellingWizard.tsx` — optional questionnaire flow
12. `useQuoteLines` hook, `useProductCatalog` hook, `useBundleConfiguration` hook

---

## Acceptance Criteria

- AC1: Product search returns results matching name or SKU in < 300ms
- AC2: Filters correctly narrow the catalog (e.g., Family = PT Core shows only PT Core products)
- AC3: Bundle configurator shows correct features and options from the bundle configuration (TASK-124)
- AC4: Validation error fires and blocks "Add to Quote" when a rule condition is violated
- AC5: Line table shows all added products with correct prices from the active price book
- AC6: Changing quantity triggers recalculation and updates line total and quote totals
- AC7: Discount > maxManualDiscount shows an inline error; discount > 0 on NonDiscountable product is blocked
- AC8: Price waterfall breakdown is accurate (sums to net total)
- AC9: Bundle children are indented and locked under their parent

---

## Dependencies

- TASK-118 (Price Books) — catalog shows price-book-specific prices
- TASK-119 (Discount Schedules) — tier discounts fire on quantity change
- TASK-120 (Price Rules) — rules fire during recalculation
- TASK-124 (Bundle Config) — bundle structure drives configurator
- TASK-136 (Pricing Engine) — backend calculation service

---

## Estimated Effort
**Backend:** 4 days | **Frontend:** 8 days | **Testing:** 3 days
**Total:** 15 days
