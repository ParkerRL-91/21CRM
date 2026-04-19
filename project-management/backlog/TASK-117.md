# TASK-117 — Admin: Product Catalog Management
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Required before any quoting is possible

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** a dedicated Product Catalog management screen where I can create, edit, deactivate, and organize all sellable products with their full pricing attributes,
**so that** sales reps see a curated, accurate catalog and can never quote products we don't sell or at prices we don't support.

---

## Background & Context

The product catalog is the foundation of CPQ. Every quote line item references a product record. If the catalog is wrong, every quote is wrong. PhenoTips sells ~40 distinct SKUs across 6 product families, 3 regions, and multiple pricing configurations (flat annual, per-user tiered, one-time setup fees, add-on modules).

The admin must be able to:
- See all products in a filterable table
- Create new products with the full field set
- Edit existing product pricing without breaking existing quotes
- Deactivate products that are no longer sold (soft delete, never hard delete)
- Bulk import from CSV/Excel
- Preview what a product looks like on a quote line

---

## Features Required

### 1. Product List View
- Filterable table with columns: Name, SKU, Family, Billing Type, Config Type, List Price, Currency, Region, Price Book, Status (Active/Inactive)
- Filters: Family (multi-select), Region, Currency, Price Book, Active/Inactive toggle, Billing Type
- Search by name, SKU, product code
- Sort by any column
- Bulk actions: Activate, Deactivate, Assign to Price Book, Delete (soft)
- "New Product" button → opens product detail panel/drawer
- Row click → opens product detail panel (slide-over, not page navigation)

### 2. Product Detail Panel (Create/Edit)
**Basic Info tab:**
- Name (required)
- SKU (required, must be unique, auto-suggest format: `PT-{FAMILY}-{DESCRIPTOR}-{REGION}`)
- Product Code (optional, for ERP sync)
- Product Family (SELECT: PT Core / PPQ / CRAT / Add-Ons / Integrations / Professional Services)
- Description (rich text, shown on quote document)
- Tags (comma-separated, for search)
- Is Active toggle
- Sort Order (number, for product selector ordering)

**Pricing tab:**
- Billing Type (SELECT: Recurring / One-Time / Usage / Milestone)
- Billing Frequency (SELECT: Monthly / Quarterly / Semi-Annual / Annual) — shown only if Recurring
- Config Type (SELECT: Flat / Per-Unit / Tiered-Graduated / Volume-All-Units / Term-Based / Ramp)
- Price Book (SELECT: Standard / Healthcare / Government / Research-Cloud)
- Region (SELECT: US / UK / Global)
- Currency (SELECT: USD / GBP / CAD)
- List Price (CURRENCY input with currency selector)
- Floor Price (CURRENCY — minimum net price after discounts)
- Cost Basis (CURRENCY — for margin display, not shown on quotes)
- Effective Date (DATE)
- Expiration Date (DATE, optional)

**Pricing Rules tab (conditional based on Config Type):**
- **If Tiered or Volume:** Tier Table editor
  - Add/remove rows
  - Per row: From (qty), To (qty), Price per unit, Price Type (per unit / flat)
  - Visual preview: "Units 1–10: $X each, 11–50: $Y each, 51+: $Z each"
- **If Term-Based:** Term Discount Table
  - Per row: Term (months), Discount %
  - E.g., 12 months: 0%, 24 months: 10%, 36 months: 15%
- **If Ramp:** Ramp Schedule
  - Per row: Year, Multiplier
  - E.g., Year 1: 1.0x, Year 2: 1.05x, Year 3: 1.10x

**Quantity & Constraints tab:**
- Minimum Quantity (number, default 1)
- Maximum Quantity (number, null = unlimited)
- Default Quantity (pre-fill in quote line)
- Allow Manual Price Override (toggle)
- Allow Manual Discount (toggle)
- Max Manual Discount % (number, shown only if allow manual discount = on)

**Bundling tab:**
- Is Bundle Parent (toggle)
- Is Bundle Component (toggle)
- Required Products (multi-select from catalog, must also be on quote)
- Excluded Products (multi-select, cannot coexist on quote)
- Bundle Components (table: SKU, Min Qty, Max Qty, Optional)

**Tax tab:**
- Is Taxable (toggle)
- Tax Code (text, for integration with tax engine)
- Tax Category (SELECT: Software / Services / Hardware)

### 3. Bulk Import
- CSV template download with all required columns + sample data
- CSV/Excel file upload with column mapping step
- Validation report before commit (list errors by row)
- Dry-run mode: "Import would create X, update Y, skip Z"
- Commit to create/update records

### 4. Version History
- Every save creates a version snapshot
- "View history" shows a timeline of price changes with diffs
- Can revert to previous version (creates new version, does not overwrite)

### 5. Product Preview
- "Preview on Quote" button → simulates what this product looks like as a quote line item with a given quantity and date

---

## Admin UX Requirements

- Slide-over panel (not modal, not new page) — keeps list visible in background
- Multi-tab panel with sticky save/cancel bar
- Unsaved changes guard ("You have unsaved changes — Leave or Stay?")
- Required field indicators (asterisk + red border on blur)
- SKU uniqueness validated on blur via API
- Tier table rows are draggable to reorder
- Currency input shows formatted preview: `$34,999.00/yr`
- "Duplicate product" action to clone as starting point for similar product

---

## Definition of Success

- [ ] Admin can view all products with filters and search in under 1 second
- [ ] Admin can create a product with all fields in under 3 minutes
- [ ] Admin can edit list price and floor price of existing product
- [ ] Admin can deactivate a product (it disappears from quote product selector)
- [ ] Admin can define tiered pricing with 3+ tiers and save correctly
- [ ] Admin can import 40 products from CSV in one operation
- [ ] Deactivated products remain on existing quote lines (no retroactive removal)
- [ ] Product with `maxManualDiscount = 0` cannot be discounted by rep

---

## Method to Complete

### Backend
1. Enhance `PriceConfiguration` entity/object with all new fields (tiers JSON, rampSchedule JSON, bundling fields)
2. Create `ProductService` with full CRUD + soft-delete + version history
3. `GET /cpq/products` with filter params
4. `POST /cpq/products`, `PATCH /cpq/products/:id`, `DELETE /cpq/products/:id` (soft)
5. `GET /cpq/products/:id/history` for version timeline
6. `POST /cpq/products/import` for CSV bulk import
7. Validation: SKU uniqueness, floor price ≤ list price, effective date ≤ expiration date

### Frontend
1. `ProductCatalogAdminPage.tsx` — filterable table
2. `ProductDetailPanel.tsx` — slide-over with tabs
3. `TierTableEditor.tsx` — dynamic row editor for tiered pricing
4. `TermDiscountEditor.tsx` — for term-based pricing
5. `BundleComponentEditor.tsx` — bundle builder
6. `ProductImportWizard.tsx` — 3-step: upload → map → confirm
7. `useProductCatalog` hook for list + filters
8. `useProductDetail` hook for CRUD on single product

---

## Acceptance Criteria

- AC1: Product table loads all catalog products with correct column data
- AC2: Filtering by Family narrows list correctly
- AC3: Creating product with all required fields saves without error
- AC4: Duplicate SKU shows inline error before form submission
- AC5: Deactivated product does not appear in quote product selector
- AC6: Tiered pricing calculates correctly when added to a quote line
- AC7: CSV import with 40 rows completes in under 10 seconds
- AC8: Price history shows every price change with actor and timestamp

---

## Dependencies

- TASK-116 (Global Settings) — needed for default price book, currency, region
- TASK-118 (Price Books) — price book lookup needed in product form
- `PriceConfiguration` CPQ object must exist (from `cpq-setup.service.ts`)

---

## Estimated Effort
**Backend:** 4 days | **Frontend:** 5 days | **Testing:** 2 days
**Total:** 11 days
