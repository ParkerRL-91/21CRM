# TASK-145 — User: Quick Quote — Express Lane for Standard Deals
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Must ship alongside the full Quote Builder; this IS the primary rep workflow

---

## User Story

**As a** sales rep at PhenoTips,
**I want** an express quote path where I can pick a pre-saved deal configuration, set the quantity and term, and generate a complete quote in under 90 seconds,
**so that** I don't need to navigate through a full product catalog and split-pane line editor for the 80% of deals that use the same 3–5 products.

---

## Background & Context

This task addresses a fundamental usability gap: the full Quote Line Editor (TASK-127) is a power-user tool designed for complex, multi-product deals. It is correct for 20% of deals. For the remaining 80% — where a rep is selling PT Core + 1 module + maybe SSO — it is significant overhead.

The "Quick Quote" or "Express Lane" mode provides a structured shortcut using pre-saved deal configurations (templates). One click inserts the pre-configured product set; the rep adjusts quantity and term; the quote is ready.

This is analogous to "Favorite Configurations" or "Quote Templates" in Salesforce CPQ and DealHub.

---

## Features Required

### 1. Deal Configuration Templates (Admin-Managed)

A "Deal Configuration" is a named preset containing:
- **Name** (e.g., "Standard Hospital Deal", "Academic Starter", "UK Enterprise Bundle")
- **Description** (shown to reps when selecting)
- **Product Lines**: an ordered list of:
  - Product SKU (lookup)
  - Default Quantity
  - Quantity is Editable (can rep change it?)
  - Notes (pre-filled line note)
- **Default Term** (months)
- **Default Billing Frequency**
- **Tags** (for search)
- **Is Active** (admin toggle)
- **Restricted to Rep** (optional — show only to certain roles/reps)

Admin manages deal configurations at `/settings/cpq/deal-configurations`.

Seed defaults for PhenoTips:
- "PT Core — Standard Hospital" (PT Core, 12mo annual)
- "PT Core + PPQ" (PT Core + PPQ, 12mo annual)
- "Full Platform — US" (PT Core + PPQ + CRAT + SSO, 12mo annual)
- "Full Platform — UK" (PT Core + PPQ + CRAT + SSO in GBP, 12mo annual)
- "Enterprise + PS" (Full Platform + NLP Training setup fee)

### 2. Quick Quote Entry Point

**Two access paths:**

**Path A: From "New Quote" modal (Step 1)**
On the quote creation modal (TASK-126), after filling in Account/Opportunity/Contact/Currency/Term, there is a third option:
```
How do you want to build this quote?

⊙ Use a deal configuration (recommended for standard deals)
○ Start with the full product catalog
○ Start with a blank quote
```

If "Use a deal configuration" is selected, a grid of configuration cards appears below:

```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ Standard Hospital Deal       │  │ Full Platform — US           │
│ PT Core, 12mo, Annual        │  │ PT Core + PPQ + CRAT + SSO  │
│ $34,999 base / yr            │  │ $63,996 base / yr           │
│          [Select →]          │  │          [Select →]          │
└─────────────────────────────┘  └─────────────────────────────┘
```

**Path B: From an existing Quote (add configuration)**
From the Quote Line Editor, a "Add from Configuration" button at the top of the right panel inserts a configuration's products as a batch. Useful for starting with one configuration and adding to it.

### 3. Quick Quote Flow (after configuration selected)

After selecting a deal configuration:

**Quick Quote Form — single screen:**
```
Quote QTE-2026-0049 — Genome Diagnostics Ltd
Based on: Full Platform — US

Products:                    Qty      Price/unit (list)
PT Core — Platform Fee        1       $34,999/yr
PPQ Module                    1       $12,999/yr
CRAT Module                   1       $9,999/yr
SSO Integration               1       $5,999/yr
─────────────────────────────────────────────────────
Total ARR:                            $63,996/yr

User Count / Tier:       [▾ 11–50 users]   (affects volume discount)
Term:                    [12 months ▾]
Billing:                 [Annual ▾]
Quote Expiry:            [May 20, 2026]

[Adjust Products / Discounts →] (opens full line editor)
[Generate Quote →]              (saves and shows quote detail)
```

- Quantity fields editable inline (changing user count tier changes volume discount)
- Price shown updates with volume discount applied
- "Generate Quote" creates the quote with the configured lines pre-calculated
- "Adjust Products / Discounts" opens the full Line Editor for power editing

**What does NOT require the full line editor:**
- Standard products at standard prices
- Changing quantity within a tier
- Changing term or billing frequency
- Setting expiry date
- Changing the contact or primary signer

**What DOES require the full line editor:**
- Adding a product not in the configuration
- Applying a manual discount
- Setting a special price
- Changing start dates per line
- Adding line notes
- Removing a product from the configuration

### 4. Favorites Shelf

Independent of deal configurations (which are admin-managed), each rep can maintain a personal "Favorites" shelf of their most-used products (already planned in TASK-127). These provide shortcuts in the product catalog but do not create a full quick quote — they just pre-filter the catalog.

### 5. Recent Quotes Shortcut

On the New Quote modal: "Start from a recent quote" option — shows the rep's last 5 quote numbers with account name and ARR. Selecting one clones that quote into a new Draft. This is the most common workflow for reps who repeat similar deals.

---

## Admin: Deal Configuration Manager

`/settings/cpq/deal-configurations`

- Table: Name, Products (count), Default Term, Tags, Active, Used (# quotes in last 90 days)
- Create, edit, deactivate, clone
- Drag-to-reorder the list (affects order shown to reps)
- "Preview as Rep" — opens the Quick Quote form with this configuration selected

---

## Definition of Success

- [ ] Rep can go from "New Quote" to a complete draft quote with 4 products in under 90 seconds
- [ ] Deal configuration pre-populates all lines with correct prices from the active price book
- [ ] Volume discount fires automatically when the rep selects a user count tier in Quick Quote
- [ ] Changing the term in Quick Quote recalculates prices (term discount fires)
- [ ] "Adjust Products" opens the full Line Editor with the configuration lines already loaded
- [ ] Admin can create a "UK Enterprise Bundle" configuration that pre-fills GBP prices
- [ ] The 5 PhenoTips default configurations are seeded by the Setup Wizard (TASK-144)
- [ ] "Start from recent quote" clones the selected quote as a new Draft

---

## Method to Complete

### Backend
1. `DealConfiguration` entity: `name`, `description`, `lines` (JSONB array of {productId, qty, editable, note}), `defaultTerm`, `defaultBillingFrequency`, `tags`, `isActive`
2. `GET /cpq/deal-configurations` — list for rep selection
3. `POST /cpq/deal-configurations` — admin create
4. `POST /cpq/quotes/:id/apply-configuration` — add configuration lines to a quote (calls pricing engine)
5. `POST /cpq/quotes/create-from-configuration` — creates quote + applies configuration in one call
6. Seed: 5 PhenoTips default configurations added to TASK-144 setup wizard defaults

### Frontend
1. `QuickQuoteModal.tsx` — enhanced New Quote modal with configuration selection
2. `DealConfigurationCard.tsx` — configuration grid card
3. `QuickQuoteForm.tsx` — single-screen form with editable quantities + price preview
4. `DealConfigurationAdminPage.tsx` — admin management at `/settings/cpq/deal-configurations`
5. `useQuickQuote` hook

---

## Acceptance Criteria

- AC1: Rep selects "Full Platform — US" configuration and sees 4 products pre-filled with correct prices in < 1 second
- AC2: Changing user count tier from "1–10" to "11–50" updates prices to reflect volume discount
- AC3: "Generate Quote" creates a Quote in Draft status with all 4 lines pre-calculated; no further editing required for standard deals
- AC4: "Adjust Products" opens the Line Editor with the configuration lines already present
- AC5: Admin creates a new configuration; it appears in the rep's configuration grid within 30 seconds
- AC6: "Start from recent quote" clones the quote correctly (new number, Draft status, cleared approvals)

---

## Dependencies

- TASK-118 (Price Books) — configuration lines use price-book prices
- TASK-119 (Discount Schedules) — volume discounts fire in Quick Quote
- TASK-126 (Quote Builder) — New Quote modal enhanced here
- TASK-127 (Product Configurator) — "Adjust Products" opens this
- TASK-144 (Setup Wizard) — seeds default configurations

---

## Estimated Effort
**Backend:** 2 days | **Frontend:** 3 days | **Testing:** 1 day
**Total:** 6 days
