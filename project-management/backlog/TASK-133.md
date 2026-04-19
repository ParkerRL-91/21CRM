# TASK-133 — User: Contract Management Screen
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Post-sale visibility and subscription management

---

## User Story

**As a** Customer Success Manager at PhenoTips,
**I want** a comprehensive Contract Management view that shows me every active contract, its subscription details, amendment history, renewal status, and health metrics,
**so that** I always know what each customer is contracted for, when their contract renews, and where there are expansion or churn risk signals.

---

## Background & Context

Once a contract is activated, the CRM shifts from a sales tool to a customer success tool. The Contract Management screen serves:
- **CSMs**: monitor active subscriptions, track health, initiate renewals
- **Finance**: verify ARR, billing terms, payment status
- **Sales reps**: check contracted prices, understand what's been sold, identify expansion opportunities
- **RevOps**: audit trail of all amendments and pricing changes

---

## Features Required

### 1. Contract List View (`/cpq/contracts`)

**Filterable table:**

| Contract # | Account | Status | ARR | MRR | Start | End | Renewal | CSM | Rep |
|------------|---------|--------|-----|-----|-------|-----|---------|-----|-----|
| CNT-2026-42 | Genome Ltd | Active | $111,997 | $9,333 | 5/1/26 | 4/30/27 | 4/30/27 | Jane D | Mike T |

**Filters:**
- Status: Active / Expired / Cancelled / In Renewal / Churned
- CSM (multi-select)
- Rep (multi-select)
- Renewal Date (within 30 / 60 / 90 days)
- ARR range (min/max)
- Region / Currency

**Views:**
- **List view**: standard sortable table
- **Renewal board**: Kanban board grouped by renewal health (Green = 90+ days out, Yellow = 30–90 days, Red = < 30 days or no action taken)
- **ARR waterfall chart**: visual chart of ARR by start date showing when contracts roll off

**Quick actions per row:**
- Initiate Renewal (opens TASK-134 flow)
- Initiate Amendment (opens TASK-135 flow)
- View Contract
- Download Signed Document

### 2. Contract Detail Page

**Header metrics card:**
```
CNT-2026-0042                             ● Active
Genome Diagnostics Ltd

ARR: $111,997    MRR: $9,333    TCV: $111,997
Start: May 1, 2026    End: April 30, 2027    Term: 12 months
Renewal Date: April 30, 2027    Days to Renewal: 247
CSM: Jane Davidson    AE: Mike Torres
```

**Tabs:**

**Overview tab:**
- Financial terms (billing frequency, payment terms, currency)
- Renewal settings (auto-renew, renewal term, pricing method, uplift %)
- Signatories (signed by, signed date)
- Internal notes (CSM-only field)
- Health score inputs (CSM manually rates: Engaged / At Risk / Churning)
- Custom fields (e.g., Legal entity name, PO Number, specific compliance notes)

**Subscriptions tab:**
Full subscription table (from TASK-132) with additional columns:
- `Last Usage Check` — date of last usage/adoption data pull (if integrated)
- `Usage Status` — Active / Low Usage / No Login in 30 days (from usage integration)
- `Contracted Qty` vs `Active Users` (if usage integration exists)
- Expand row → shows subscription history (quantity changes, price changes)

**Amendment History tab:**
Chronological list of all amendments to this contract:
```
#  Date         Type                       Delta ARR    Status       Created By
3  Mar 15, 2026 Quantity Increase (+10u)   +$12,000    Contracted   Mike Torres
2  Jan 10, 2026 Add CRAT Module           +$9,999     Contracted   Mike Torres
1  Jan 1, 2026  Upsell to Annual from Mo   $0          Contracted   Jane Davidson
```
Clicking an amendment → opens the amendment quote record

**Renewal tab:**
- Renewal opportunity status
- Renewal quote (if created) with link
- "Create Renewal Quote" button (→ TASK-134)
- Renewal risk score (calculated from: days to renewal, usage health, past renewal history, open support tickets)
- Renewal notes (CSM-editable)

**Documents tab:**
- Original signed quote PDF
- Contract document (if separate)
- Amendment documents
- PO / MSA / NDA attachments (file upload)
- All documents with version, date, and download link

**Activity tab:**
Full activity timeline: every action, email, meeting, note, and system event related to this contract

### 3. Subscription Management Actions

From the Subscriptions tab, CSM can initiate:

**"Add Seats" action:**
- Opens a quantity-change dialog
- New quantity → system calculates prorated charge
- Creates an Amendment Quote pre-configured with the seat change
- Rep reviews and sends for approval

**"Remove Product" action:**
- Selects which subscription line to terminate
- Effective date (today or end of billing period)
- Creates an Amendment Quote with the removal

**"View Pricing" action:**
- Shows the full contracted price waterfall for this subscription
- "Contracted Price" vs "Current List Price" comparison — surfaces upsell opportunity if list price has increased

### 4. ARR Dashboard Panel

Summary metrics for the CSM's portfolio:
```
My Contract Portfolio:
  Total ARR: $2.4M
  Renewals Next 90 Days: $320K
  At Risk (Low Health): $85K
  Average Contract Tenure: 2.3 years
  NRR (Net Revenue Retention): 118%
```

This is a simplified view; deeper analytics are in TASK-143 (CPQ Reporting Dashboard).

### 5. Contract Expiry Alerts

System-generated alerts on contracts:
- **90 days before renewal**: "Renewal approaching — start renewal motion" (creates a task for the CSM)
- **60 days before renewal**: "Renewal not yet started — follow up with customer" (notification to CSM + manager)
- **30 days before renewal**: "Urgent — renewal in 30 days without a quote" (high-priority alert)
- **Day of expiry with no renewal**: Contract status → `Expired`; CSM notified; Opportunity created as `Closed Lost — Churned`

---

## UX Requirements

- Contract list with 100+ records loads in < 2 seconds
- Renewal board is the default view for CSMs (they live in this view)
- Contract detail is read-heavy — prioritize scan-ability over edit density
- Mobile responsive for quick reference (CSMs often check on mobile during customer calls)
- Inline edit for CSM-owned fields: health score, internal notes, CSM assignment, renewal notes

---

## Definition of Success

- [ ] CSM can see all their assigned contracts with ARR, renewal date, and health in a single view
- [ ] Renewal board correctly groups contracts by days-to-renewal buckets
- [ ] Contract detail shows all subscriptions with correct contracted quantities and prices
- [ ] Amendment history shows all changes to the contract in chronological order
- [ ] 90/60/30 day renewal alerts fire correctly (create tasks, send notifications)
- [ ] "Add Seats" action creates a pre-filled Amendment Quote in one click
- [ ] Contract ARR updates correctly when an amendment is contracted

---

## Method to Complete

### Backend
1. `GET /cpq/contracts` — list with filters + sort + pagination
2. `GET /cpq/contracts/:id` — detail with subscriptions, amendments, documents
3. `GET /cpq/contracts/:id/subscriptions` — subscription list with usage data (if available)
4. `GET /cpq/contracts/:id/amendments` — amendment history
5. `PATCH /cpq/contracts/:id` — update CSM-editable fields (health, notes, renewal settings)
6. Renewal alert scheduler: `ContractRenewalAlertJob` — cron job running nightly, checking all active contracts for 90/60/30-day milestones
7. `POST /cpq/contracts/:id/initiate-amendment` — creates amendment quote from contract

### Frontend
1. `ContractListPage.tsx` — filterable table + renewal board view toggle
2. `RenewalBoardView.tsx` — Kanban board
3. `ContractDetailPage.tsx` — full detail with tabs
4. `ContractOverviewTab.tsx`
5. `ContractSubscriptionsTab.tsx`
6. `ContractAmendmentHistoryTab.tsx`
7. `ContractRenewalTab.tsx`
8. `ContractDocumentsTab.tsx`
9. `ContractARRDashboard.tsx` — portfolio summary
10. `useContracts` hook, `useContractDetail` hook

---

## Acceptance Criteria

- AC1: Contract list loads with correct ARR, MRR, and renewal date for 50+ contracts in < 2 seconds
- AC2: Renewal board correctly places contracts in the right time bucket
- AC3: Subscriptions tab shows all active subscriptions with contracted prices (not current list prices)
- AC4: 90-day renewal alert creates a CRM task assigned to the CSM on schedule
- AC5: Contract ARR field updates within 1 minute of an amendment being contracted
- AC6: "Add Seats" action creates an Amendment Quote with the correct products pre-populated

---

## Dependencies

- TASK-132 (Quote-to-Contract) — creates contracts
- TASK-134 (Renewal Queue) — renewal flow initiated from here
- TASK-135 (Contract Amendment) — amendment flow initiated from here
- TASK-139 (Contract Lifecycle Service) — service layer

---

## Estimated Effort
**Backend:** 3 days | **Frontend:** 5 days | **Testing:** 1 day
**Total:** 9 days
