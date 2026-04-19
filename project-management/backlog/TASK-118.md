# TASK-118 — Admin: Price Book Configuration
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Required before quoting

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** to manage multiple price books — Standard, Healthcare Institutional, Government/Non-Profit — each with their own list prices per product,
**so that** quotes automatically use the correct pricing based on the account's customer segment, region, and contract tier without reps needing to manually adjust prices.

---

## Background & Context

Every CPQ quote is tied to a Price Book. The Price Book determines which list prices are available for each product. PhenoTips needs at minimum:
- **Standard** — default list prices in USD and GBP
- **Healthcare Institutional** — discounted academic/hospital pricing
- **Government/Non-Profit** — reduced rates for public sector
- **Research Cloud** — dedicated research org pricing

Each Price Book has its own entries (Product + Price + Currency). When a new quote is created, the system selects the right price book based on the account's segment. Reps cannot switch price books mid-quote unless they have the permission to do so.

Analogous to Salesforce's `Pricebook2` + `PricebookEntry` objects.

---

## Features Required

### 1. Price Book List
- Table: Name, Code, Description, Currency, Is Default, Is Active, # Products, # Currencies
- Create new price book button
- Clone existing price book (copies all entries)
- Edit price book details
- Activate/Deactivate toggle
- "View Entries" → expands inline or navigates to entries view

### 2. Price Book Detail (Header)
- Name (required, unique)
- Code (e.g., `HEALTHCARE`, `STANDARD`, `GOVT`)
- Description (for admin context — explains who should get this price book)
- Is Default (only one price book can be default)
- Is Active toggle
- Discount from Standard % (optional — auto-apply a flat % reduction vs. standard book)
- Applicable Regions (multi-select: US / UK / Global)
- Currency (primary currency: USD / GBP / CAD)
- Requires Approval to Apply (toggle — applying this price book needs deal desk sign-off)

### 3. Price Book Entries
Each entry = one Product × Currency combination in a price book.

**Entry fields:**
- Product (lookup — shows name, SKU, family)
- Currency (USD / GBP / CAD)
- Unit Price (override list price for this price book)
- Use Standard Price (checkbox — mirrors the Standard Price Book price instead of custom entry)
- Is Active (must be active to be addable to quotes)
- Effective Date
- Expiration Date

**Entry Table:**
- Grouped by Product Family (collapsible sections)
- Columns: Product Name, SKU, Currency, Standard Price, This Price Book Price, % Off Standard, Effective Date, Active
- Inline edit: click price cell to edit in-place
- Bulk update: select rows → bulk set price or % change
- Filter by: currency, family, active status
- Import entries from CSV
- Export to CSV/Excel

### 4. Auto-Assignment Rules
Configure when a price book is auto-assigned to new quotes:

- By Account Type (picklist match: Healthcare / Academic / Government / Commercial)
- By Account Region (billing address country)
- By Opportunity Amount (e.g., Enterprise accounts over $X get a specific price book)
- Priority order (if multiple rules match, highest priority wins)
- Default fallback: Standard Price Book

### 5. Standard Price Book (Source of Truth)
- Every product must have a Standard Price Book entry before a custom entry
- Standard Price Book cannot be deleted
- "Standard" flag is system-controlled
- All custom price book entries show "% off Standard" as a computed column

### 6. Price Book Header — Validity Dates

Price books now carry `effectiveDate` and `expirationDate` at the header level (in addition to per-entry dates):

- **Effective Date** — the date from which this price book version is active (e.g., "Jan 1, 2026 pricing")
- **Expiration Date** — optional; when set, this price book auto-deactivates on that date
- **Version label** — optional free-text label like "FY2026 Standard" for easy identification
- On quote creation, the auto-assignment engine selects the price book whose `effectiveDate ≤ quoteDate < expirationDate`

### 7. Bulk Price Adjustment Wizard

Accessed via "Bulk Update Prices" button on the price book list. Used during annual pricing updates:

**Step 1 — Select Scope:**
```
Apply to:  ⊙ All products in this price book
           ○ Specific product families: [Modules ▾] [Integrations ▾]
           ○ Selected products (opens multi-select grid)
Currency:  ⊙ USD only  ○ GBP only  ○ All currencies
```

**Step 2 — Adjustment Method:**
```
Adjustment type:
  ⊙ Percentage increase:   [5] %   (e.g., 5% annual uplift)
  ○ Percentage decrease:   [  ] %
  ○ Fixed amount increase: [  ] USD/GBP
  ○ Set to exact amount:   [  ] (only valid for single product)

Rounding:  ⊙ Round to nearest dollar  ○ Round to nearest cent  ○ No rounding

New Effective Date: [Jan 1, 2027]   (creates new entries; does not overwrite current)
```

**Step 3 — Preview:**
```
Product                  Current Price   New Price    Change
PT Core — Platform Fee   $34,999/yr      $36,749/yr   +$1,750 (+5.0%)
PPQ Module               $12,999/yr      $13,649/yr   +$650  (+5.0%)
CRAT Module              $9,999/yr       $10,499/yr   +$500  (+5.0%)
...
42 products total | $0 below floor price | 0 errors
```

**Step 4 — Apply:**
- Creates NEW `PriceBookEntry` records with `effectiveDate = selectedDate`
- Does NOT modify existing entries (preserves audit trail)
- New entries auto-expire existing ones for the same product/currency on the effective date
- Confirmation: "42 new price book entries created effective Jan 1, 2027"

---

## Admin UX Requirements

- Price book list is compact — most admins have 3–6 price books max
- Entry editor supports bulk import with validation (can't set price below floor price)
- "Sync from Standard" button — copies Standard Price Book prices into this price book as a starting point, then allows % adjustment
- Visual diff: comparing two price books side by side (helpful when updating prices annually)
- "Price Book Assignment" tab shows which accounts are currently assigned to each book

---

## Definition of Success

- [ ] Admin can create Standard, Healthcare, Government, Research-Cloud price books
- [ ] Each price book has entries for all 42 PhenoTips products
- [ ] Auto-assignment rules correctly route new quotes to the right price book based on account type
- [ ] A new quote inherits the price book from the account's auto-assignment rule
- [ ] Changing a price book entry does not retroactively change existing quote line prices
- [ ] Only one price book can be marked as default at a time
- [ ] Price book entries below floor price trigger a validation error

---

## Method to Complete

### Backend
1. Create `PriceBook` entity: `name`, `code`, `description`, `isDefault`, `isActive`, `discountFromStandard`, `applicableRegions`, `currency`, `requiresApproval`
2. Create `PriceBookEntry` entity: `priceBookId`, `productId`, `currency`, `unitPrice`, `useStandardPrice`, `isActive`, `effectiveDate`, `expirationDate`
3. Create `PriceBookAssignmentRule` entity: rules for auto-assigning price books to accounts/opportunities
4. `GET /cpq/price-books` — list all
5. `POST /cpq/price-books` — create
6. `PATCH /cpq/price-books/:id` — update header
7. `GET /cpq/price-books/:id/entries` — list entries (with product name, family denormalized)
8. `POST /cpq/price-books/:id/entries` — create entry
9. `PATCH /cpq/price-books/:id/entries/:entryId` — update entry price
10. `POST /cpq/price-books/:id/entries/import` — bulk CSV import
11. Validation service: floor price check, standard price existence check

### Frontend
1. `PriceBookListPage.tsx` — admin page at `/settings/cpq/price-books`
2. `PriceBookDetailPanel.tsx` — slide-over for header fields
3. `PriceBookEntriesTable.tsx` — grouped by family, inline edit
4. `PriceBookImportWizard.tsx` — CSV import flow
5. `PriceBookAssignmentRulesPanel.tsx` — rule builder
6. `usePriceBooks` hook for list/CRUD
7. `usePriceBookEntries` hook for entries

---

## Acceptance Criteria

- AC1: Four price books (Standard, Healthcare, Government, Research-Cloud) can be created and activated
- AC2: Every product can have a price book entry in every price book + currency combination
- AC3: Auto-assignment rule correctly selects Healthcare price book for an account with type = Healthcare
- AC4: New quote for a Healthcare account shows prices from Healthcare price book, not Standard
- AC5: Changing a price book entry after a quote is created does not change that quote's existing line prices
- AC6: CSV import of 42 product entries completes in < 5 seconds with validation report
- AC7: "% off Standard" column shows correct calculation for every entry

---

## Dependencies

- TASK-116 (Global CPQ Settings) — default price book setting
- TASK-117 (Product Catalog) — products must exist before entries can be created

---

## Estimated Effort
**Backend:** 3 days | **Frontend:** 4 days | **Testing:** 1 day
**Total:** 8 days
