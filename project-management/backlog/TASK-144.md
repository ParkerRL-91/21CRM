# TASK-144 — CPQ Setup Wizard & Data Migration
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Required to go live on Day 1

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** a guided CPQ Setup Wizard that walks me through configuring the system from scratch — products, price books, discount schedules, approval rules, and templates — in a logical order with validation at each step,
**so that** I can get CPQ production-ready in a single day without a Salesforce implementation consultant.

---

## Background & Context

A CPQ system with zero configuration is useless. This task ensures PhenoTips can go live quickly by:
1. Providing a step-by-step wizard that guides the admin through the essential setup
2. Pre-seeding PhenoTips-specific default data (already started in TASK-116 `cpq-setup.service.ts`)
3. Providing a health check that validates the setup is complete before the system is "activated" for reps

The wizard runs once (on first CPQ activation) and can be re-entered at any time to fill gaps. It does NOT block reps from using the system if it's incomplete — it's a guide, not a gate.

---

## Features Required

### 1. Setup Wizard Entry Point

Located at `/settings/cpq` (the main CPQ Settings page, TASK-116), a banner appears when CPQ is not fully configured:

```
⚠ CPQ Setup Incomplete
5 of 9 setup steps complete. 
[Continue Setup →]  or dismiss
```

Clicking "Continue Setup" opens the wizard. Progress is persisted — the admin can stop and resume.

### 2. Setup Wizard Steps

**Step 1: Create CPQ Objects** (already implemented in `cpq-setup.service.ts`)
- Shows the 6 CPQ objects (Quote, Contract, ContractSubscription, ContractAmendment, QuoteLineItem, PriceConfiguration)
- Status: Created / Not Created
- "Enable CPQ" button (runs `setupCpq()`)
- Success: all 6 objects created, 50 fields defined
- Can be skipped if objects already exist

**Step 2: Configure Global Settings**
- Links to TASK-116 Global Settings form
- Shows completion status: "Quote defaults ✓ | Pricing engine ✓ | Approvals ✓ | Contract ✓"
- Quick-set panel with the 5 most critical settings:
  - Default billing frequency (Annual)
  - Default subscription term (12 months)
  - Default quote expiry (30 days)
  - Default renewal uplift (5%)
  - Enable approval workflow (toggle)

**Step 3: Import Product Catalog**
- "Load PhenoTips Defaults" button → seeds 42 products from `PHENOTIPS_CATALOG_US` + `PHENOTIPS_CATALOG_UK`
- Shows: "28 US products + 14 UK products loaded"
- Status: X products in catalog
- Or: "Upload CSV" → opens the import wizard from TASK-117

**Step 4: Configure Price Books**
- Standard price book is auto-created with all catalog products
- Quick-create buttons: "Add Healthcare Price Book", "Add Government Price Book"
- Shows: "Standard ✓ | Healthcare — setup | Government — setup"

**Step 5: Add Discount Schedules**
- "Load PhenoTips Default Schedules" button → creates:
  - Volume schedule: User tiers (1–10, 11–50, 51–99, 100+)
  - Term schedule: 1-year, 2-year, 3-year commitment discounts
- Links to TASK-119 Discount Schedule builder for customization
- Shows: X schedules created

**Step 6: Configure Approval Rules**
- "Load Default Approval Rules" button → creates:
  - Rule 1: Discount > 10% → Manager approval
  - Rule 2: Discount > 20% → Director approval
  - Rule 3: ARR > $100K → Deal Desk review
- Shows: X rules active
- Links to TASK-121 Approval Workflow Config

**Step 7: Create Quote Template**
- "Load Default Template" button → creates a standard PhenoTips-branded template
- Default template includes: cover page, line items table, pricing summary, T&C, signature block
- Logo upload: "Upload your company logo"
- Prompts for: company legal name, T&C text / URL
- Shows: "1 template created"

**Step 8: Configure E-Signature (Optional)**
- Links to TASK-125 Integration Settings
- Quick status: "DocuSign: Not configured | PandaDoc: Not configured"
- "Skip for now" option (can be configured later)

**Step 9: Test a Quote**
- "Create Test Quote" button → creates a sample quote with 3 PhenoTips products for a test account
- Walks the admin through: viewing the quote, editing a line, generating a document preview
- "CPQ is ready!" confirmation when test quote is generated without errors

### 3. Setup Health Check (`/settings/cpq/health`)

A checklist showing the completeness of CPQ configuration:

```
CPQ Health Check

Core Setup:
  ✓ CPQ objects created (6/6)
  ✓ Global Settings configured
  ✓ Product catalog loaded (42 products)

Pricing:
  ✓ Standard Price Book active (42 products)
  ⚠ Healthcare Price Book — only 20 of 42 products have entries
  ✓ Discount Schedules: 2 active

Approvals:
  ✓ Approval Workflow enabled
  ✓ 3 approval rules configured
  ⚠ No approval variables defined (discount thresholds may not aggregate correctly)

Documents:
  ✓ Default Quote Template configured
  ✓ Company logo set
  ⚠ No Terms & Conditions text set

Integrations:
  ⚠ E-Signature: Not configured
  ⚠ Billing Sync: Not configured

Overall Status: ⚡ Partially Configured (7/11 checks passing)
[Fix Issues →]
```

Each warning item links directly to the relevant settings page.

### 4. Data Migration for Existing Quotes

If PhenoTips already has historical quotes in spreadsheets, provide a migration tool:

**Historical Quote Import:**
- CSV template with fields: Account Name, Opportunity ID, Products (semicolon-separated SKUs), Quantities, Net Prices, Start Date, End Date, Status
- Import creates historical Quote + Contract records (status = `Historical`)
- Historical records are read-only (cannot be edited)
- Counted in ARR reporting but not routed through approval workflow

**Account Matching Logic (critical for import accuracy):**
- Account matching by exact name (case-insensitive). If no exact match: fuzzy match using Levenshtein distance threshold of 80%.
- Fuzzy matches are flagged in the import validation report: "Row 12: Account 'Genomics Diagnostics Ltd' → fuzzy-matched to 'Genome Diagnostics Ltd' (82%). Confirm?"
- Admin must explicitly approve fuzzy matches before the import runs.
- If no match at all: the row is flagged as an error; admin can either fix the CSV or pre-create the account.

**Import validation (pre-run / dry-run mode):**
- A "Dry Run" button runs all validation without creating records
- Validation report shows: total rows, valid rows, error rows, fuzzy matches, products not found in catalog
- Dry run is mandatory before the actual import can proceed
- Validation errors are exported as a new CSV with an "Error" column appended

**Error handling:**
- Partial subscription support: CSV rows with some missing quantities/prices are allowed; missing values default to 0 with a warning
- Date format validation: Start Date and End Date must be ISO 8601 or MM/DD/YYYY
- Product SKU not found in catalog: error on that row; import skips that row and continues
- Each row is independent: a failure on row 12 does not abort rows 13+
- Summary after import: "42 records created, 3 errors (see error report), 2 fuzzy matches accepted"

**Legacy Contract Import:**
- CSV with active contract data: Account, Products, Quantities, Contracted Prices, Start Date, End Date
- Creates Contract + Subscription records for active historical deals
- Same account matching logic and dry-run mode as Historical Quote Import
- Used to populate the Renewal Queue with historical contracts that need to be renewed
- Contracted Prices from the CSV are automatically saved as `ContractedPrice` records (TASK-147) for the imported account/product combinations, so future renewal quotes use the imported pricing

### 5. Rollback / Re-setup

The admin can teardown CPQ objects (already implemented as `teardownCpq()` in `cpq-setup.service.ts`):
- Full teardown: removes all 6 CPQ objects
- Confirmation: "This will delete all CPQ data including quotes, contracts, and subscriptions. This cannot be undone."
- Option: "Archive" — exports all CPQ data to JSON before teardown

---

## Definition of Success

- [ ] Admin can run the full setup wizard in under 60 minutes starting from a fresh workspace
- [ ] "Load PhenoTips Defaults" populates product catalog, discount schedules, and approval rules
- [ ] Health check correctly identifies 7/11 passing items for a partially-configured workspace
- [ ] Test quote creation succeeds end-to-end (create, add products, generate document preview)
- [ ] Historical contract import creates the correct Contract + Subscription records
- [ ] Wizard progress persists across sessions (resumable)

---

## Method to Complete

### Backend
1. `CpqSetupWizardService` — tracks wizard progress, validates each step completion
2. `CpqSetupProgressEntity` — per-workspace wizard progress record
3. `CpqHealthCheckService` — evaluates all 11 health criteria and returns results
4. `HistoricalDataImportService` — processes historical quote/contract CSV imports
5. Routes:
   - `GET /cpq/setup/progress` — current wizard step + completion status
   - `POST /cpq/setup/step/:stepId/complete` — mark step done
   - `GET /cpq/health` — health check results
   - `POST /cpq/import/historical-contracts` — bulk historical contract import

### Frontend
1. `CpqSetupWizard.tsx` — multi-step wizard component
2. `CpqSetupStep.tsx` — individual step with status + action
3. `CpqHealthCheckPage.tsx` — health checklist
4. `HistoricalImportWizard.tsx` — CSV import flow
5. Setup banner in `CpqSettingsPage.tsx` — links to wizard

---

## Acceptance Criteria

- AC1: Wizard tracks which steps are complete across sessions (restart browser, progress preserved)
- AC2: "Load PhenoTips Defaults" correctly seeds: 42 products, 2 discount schedules, 3 approval rules, 1 template
- AC3: Health check correctly identifies a workspace with no approval rules as failing that check
- AC4: Test quote creation in step 9 produces a valid quote with real prices from the catalog
- AC5: Historical contract CSV import creates Contract + Subscription records with correct contracted prices

---

## Dependencies

- TASK-116 through TASK-123 (all admin setup tasks) — wizard guides through these
- TASK-117 (Product Catalog) — "Load Defaults" calls the seed service
- `cpq-setup.service.ts` (already implemented) — createObjects/teardown already done

---

## Estimated Effort
**Backend:** 3 days | **Frontend:** 4 days | **Testing:** 1 day
**Total:** 8 days
