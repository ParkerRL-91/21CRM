# TASK-126 — User: Quote Builder — Create & Manage Quotes
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Core user-facing CPQ capability

---

## User Story

**As a** sales rep at PhenoTips,
**I want** to create a quote from an opportunity in one click, fill in the basic deal parameters (start date, term, billing frequency), and have the correct price book and defaults auto-applied based on the customer's account,
**so that** I can move quickly from discovery to a formal proposal without manually calculating prices or hunting for the right price sheet.

---

## Background & Context

Today, PhenoTips reps likely create quotes in Excel or Google Sheets from a pricing spreadsheet. This is slow, error-prone, and produces inconsistent output. The Quote Builder replaces this with a structured form that:
- Pre-fills deal context from the opportunity
- Selects the right price book automatically
- Enforces the right defaults
- Opens the Quote Line Editor for product selection

The quote header is the starting point — reps set the "frame" of the deal (who, what terms, what currency), then use the Product Configurator (TASK-127) to add products.

---

## Quote Record — Full Field Specification

### Header Fields
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `quoteNumber` | AUTO-NUMBER | System | `QTE-{YYYY}-{NNNN}` | Read-only after creation |
| `status` | SELECT | System | `Draft` | State machine controlled |
| `opportunity` | RELATION | Yes | From context | Lookup to Opportunity |
| `account` | RELATION | Yes | From opportunity | Auto-populated |
| `primaryContact` | RELATION | Yes | — | Signatory/buyer; from account contacts |
| `priceBook` | SELECT | System | Auto-assigned | From account assignment rules; overridable |
| `currency` | SELECT | Yes | From account | USD / GBP / CAD |
| `startDate` | DATE | Yes | First of next month | Per Global Settings default |
| `subscriptionTerm` | NUMBER | Yes | 12 | Months; per Global Settings default |
| `endDate` | DATE | Computed | startDate + term | Read-only; auto-calculated |
| `expirationDate` | DATE | Yes | createdAt + 30 days | Per Global Settings |
| `billingFrequency` | SELECT | Yes | Annual | Monthly / Quarterly / Semi-Annual / Annual |
| `billingType` | SELECT | Yes | Advance | Advance / Arrears |
| `paymentTerms` | SELECT | Yes | Net 30 | Net 30 / Net 45 / Net 60 / Due on Receipt |
| `type` | SELECT | System | Quote | Quote / Amendment / Renewal |
| `isPrimary` | BOOLEAN | Yes | True | Only one quote per opp is primary |
| `owner` | RELATION | System | Current user | Sales rep |
| `shipToAccount` | RELATION | No | Account | For multi-entity customers |
| `billToAccount` | RELATION | No | Account | For multi-entity customers |
| `notes` | RICH_TEXT | No | — | Internal notes, not shown on document |
| `customerNotes` | RICH_TEXT | No | — | Shown on generated document |
| `approvalStatus` | SELECT | System | Not Submitted | Not Submitted / Pending / Approved / Rejected |

### Totals (calculated, read-only)
| Field | Notes |
|-------|-------|
| `subtotal` | Sum of all line list prices (before discounts) |
| `totalDiscount` | Total discount amount (subtotal - netTotal) |
| `netTotal` | Sum of all line net totals after discounts |
| `taxTotal` | Computed by tax engine |
| `grandTotal` | netTotal + taxTotal |
| `mrr` | Monthly Recurring Revenue (netTotal ÷ 12 for annual billing) |
| `arr` | Annual Recurring Revenue |
| `oneTimeTotal` | Sum of one-time line items |

---

## Features Required

### 1. Create Quote — Entry Points
- **From Opportunity:** "New Quote" button on Opportunity record → opens Quote Builder with opportunity pre-filled
- **From Account:** "New Quote" on Account → opens without pre-filled opportunity (rep must link)
- **Standalone:** `/cpq/quotes/new` route

### 2. Quote Creation Form (Step 1: Deal Parameters)
A clean, focused form — not cluttered with every field. Just what's needed to start:
- Account (auto-filled from opportunity, editable)
- Opportunity (auto-filled if coming from opportunity)
- Primary Contact (dropdown filtered to account's contacts)
- Quote Type: New Business / Renewal / Amendment (determines template and defaults)
- Currency (auto-filled from account's billing currency; editable)
- Start Date (date picker; smart default: first of next month)
- Subscription Term (number input with quick-pick buttons: 12 / 24 / 36 months)
- Billing Frequency (radio: Monthly / Quarterly / Annual)
- Payment Terms (select)
- Expiration Date (date picker; auto-filled from Global Settings + today)

"Create Quote" button → creates the Quote record and opens the Quote Line Editor (TASK-127)

### 3. Quote Header View (after creation)
The quote record page shows:
- Quote number, status badge, type badge
- Sticky header: Account Name | Stage | Deal Value | MRR | ARR | Expiration
- Tab navigation: Lines | Details | Approvals | History | Documents

**Details tab:**
- All header fields in edit mode (inline)
- Account, Contact, Opportunity relations (linked)
- Date fields with calendar pickers
- "Change Price Book" action (requires permission; shows confirmation dialog)

**Status badge & state transitions:**
- `Draft` → [Submit for Approval] → `In Review`
- `In Review` → [Approve] → `Approved` | [Reject] → `Rejected` | [Recall] → `Draft`
- `Approved` → [Generate Document] → `Presented` | [Edit] → back to `Draft` (with warning)
- `Presented` → [Mark Accepted] → `Accepted` | [Mark Rejected] → `Rejected`
- `Accepted` → [Create Order] → `Ordered`

**Primary Quote toggle:**
- Only one quote per opportunity can be primary
- Setting a quote as primary syncs its NetTotal to the Opportunity Amount

### 4. Quote List View (`/cpq/quotes`)
Table of all quotes the rep owns:
- Columns: Quote #, Account, Opportunity, Status, Stage, Net Total, MRR, ARR, Expiration, Owner
- Filters: Status, Owner (admin can see all), Date Range, Account
- Sort by any column
- Row click → opens quote detail
- Quick actions per row: Clone, Delete (if Draft), Generate Document

### 5. Quote Cloning
"Clone Quote" action:
- Creates a new Draft quote with same lines and header fields
- New quote number generated
- Status resets to Draft
- Approval history cleared
- Useful for: multiple quote scenarios per opportunity, creating an amendment basis

### 6. Multi-Quote per Opportunity
- Opportunity can have multiple quotes
- Only one is "primary" (syncs to opportunity amount)
- Comparison view: side-by-side display of up to 3 quotes showing totals and key fields
- "Present" action — marks one quote as primary and sets status to Presented

---

## UX Requirements

- Quote creation form opens as a modal or side panel from the opportunity record (no full page navigation)
- Quote line editor opens in a full-page view (the complexity warrants it)
- Unsaved changes on quote header show a warning before navigation
- Status changes require confirmation for irreversible actions (e.g., "Mark Accepted" without e-signature)
- Mobile: quote header and approval actions must be mobile-responsive (approvers review on phones)
- "Quick Look" preview from the quote list: hover or click expands a summary card (totals, top 3 products)

---

## Definition of Success

- [ ] Rep can create a quote from an opportunity in under 2 minutes including basic fields
- [ ] Account, currency, price book, and dates auto-populate from opportunity and account data
- [ ] Quote number auto-increments and follows the configured format
- [ ] Status transitions follow the defined state machine (no skipping states)
- [ ] Setting a quote as Primary syncs its amount to the Opportunity
- [ ] Cloning a quote creates an exact copy with a new number and Draft status
- [ ] Rep can see all their quotes in the list view with filters
- [ ] Admin can see all quotes across all reps with the same list view (permission-gated)

---

## Method to Complete

### Backend
1. Enhance `Quote` CPQ object with all header fields (many may already exist; audit and add missing)
2. `QuoteService`:
   - `createQuote(dto, opportunityId?, userId)` — auto-populates from opportunity + account + settings
   - `cloneQuote(quoteId)` — deep clone including line items
   - `setAsPrimary(quoteId)` — marks primary, syncs to opportunity, unmarks others
   - `updateStatus(quoteId, newStatus)` — validates state machine transitions
   - `calculateTotals(quoteId)` — aggregates line items, calls tax engine, updates rolled-up fields
3. `GET /cpq/quotes` — list with filters
4. `POST /cpq/quotes` — create (auto-populates defaults)
5. `GET /cpq/quotes/:id` — detail with line items
6. `PATCH /cpq/quotes/:id` — update header fields
7. `POST /cpq/quotes/:id/clone` — clone
8. `POST /cpq/quotes/:id/set-primary` — set primary
9. `PATCH /cpq/quotes/:id/status` — transition status

### Frontend
1. `QuoteCreateModal.tsx` — step 1 quick form (deal params)
2. `QuoteDetailPage.tsx` — tabbed detail view
3. `QuoteHeaderPanel.tsx` — header fields with inline edit
4. `QuoteTotalsBar.tsx` — sticky MRR/ARR/Total bar
5. `QuoteStatusBadge.tsx` — colored status with action buttons
6. `QuoteListPage.tsx` — filterable table
7. `QuoteComparisonModal.tsx` — side-by-side compare view
8. `useQuote` hook, `useQuoteList` hook

---

## Acceptance Criteria

- AC1: Creating a quote from an opportunity pre-fills account, currency, opportunity, and contact
- AC2: Quote number follows `QTE-{YYYY}-{NNNN}` format and auto-increments
- AC3: Setting start date + term auto-computes end date
- AC4: Changing price book on an existing quote triggers recalculation of all line prices
- AC5: Only one quote per opportunity can be primary; setting a new primary automatically unsets the old one
- AC6: Status cannot transition from `Accepted` back to `Draft` without an explicit admin override
- AC7: Quote totals (MRR, ARR, net total) reflect the sum of all active line items

---

## Dependencies

- TASK-116 (Global Settings) — defaults for term, billing freq, expiration, quote number format
- TASK-118 (Price Books) — price book assignment to accounts
- TASK-127 (Product Configurator) — opened from the quote to add lines
- TASK-136 (Pricing Engine) — triggered on quote save to calculate totals

---

## Estimated Effort
**Backend:** 4 days | **Frontend:** 5 days | **Testing:** 2 days
**Total:** 11 days
