# TASK-134 — User: Renewal Queue & Renewal Quote Generation
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Drives Net Revenue Retention

---

## User Story

**As a** Customer Success Manager and Sales Rep at PhenoTips,
**I want** a Renewal Queue that automatically surfaces contracts approaching expiry, allows me to generate a renewal quote in one click with pricing pre-filled at the contracted rates (plus configured uplift), and tracks the renewal motion to close,
**so that** I never miss a renewal, always have a quote ready before the customer asks, and retain 100% of ARR with minimal manual effort.

---

## Background & Context

Renewals are the lifeblood of a SaaS business. A missed renewal = churned ARR. Industry best practice:
- **90 days out**: Surface the renewal, start the renewal motion
- **60 days out**: Have a renewal quote ready and sent
- **30 days out**: Renewal should be closed or escalated

The renewal quote is NOT a new quote from scratch. It's a copy of the current contract's subscription products with:
- Contracted prices optionally increased by a renewal uplift % (configured in Global Settings)
- Quantities defaulting to the current contracted quantities
- Start date = day after contract expiry
- Same billing frequency and payment terms

---

## Features Required

### 1. Renewal Queue (`/cpq/renewals`)

A dedicated view for managing all upcoming renewals:

**Filter & Sort:**
- Default filter: "Renewals in next 90 days" sorted by renewal date ascending
- Filters: CSM, Rep, Days to Renewal, ARR range, Region, Health Score
- Status filters: `Not Started`, `Quote Sent`, `Negotiations`, `Renewed`, `Churned`

**Renewal Queue Table:**

| Account | Contract # | ARR | End Date | Days Out | Health | Renewal Status | Rep | CSM | Action |
|---------|-----------|-----|----------|----------|--------|---------------|-----|-----|--------|
| Genome Ltd | CNT-042 | $112K | Apr 30 | 89 | 🟢 | Not Started | Mike T | Jane D | [Start Renewal] |
| Mayo Clinic | CNT-038 | $78K | May 15 | 104 | 🟡 | Quote Sent | Lisa P | Tom R | [View Quote] |
| NHS Trust | CNT-031 | $45K | Mar 10 | 11 | 🔴 | At Risk | Alex K | Jane D | [Escalate] |

**Health Score Colors:**
- 🟢 Green: > 90 days out, engaged customer, regular usage
- 🟡 Yellow: 30–90 days out, or some risk signals present
- 🔴 Red: < 30 days out, low usage, no renewal quote sent, or explicit churn risk

**Summary strip at top:**
```
Renewals Next 90 Days: $890K ARR across 12 contracts
At Risk (Red): $125K across 3 contracts
Avg Days to Renewal: 58
```

### 2. "Start Renewal" Flow

Clicking "Start Renewal" on a contract row:

**Step 1: Renewal Setup (modal):**
```
Create Renewal Quote for Genome Diagnostics Ltd

Based on:  ⊙ Contract CNT-2026-0042 (expires Apr 30, 2027)
           ○ Clone from prior signed quote (QTE-2025-0012 — last signed, $53,997/yr)

Renewal Term:       [12 months ▾]
Renewal Start Date: [May 1, 2027]
Pricing Method:     [● Same as Contracted   ○ Uplift (+3%)   ○ New List Price]
Price Book:         [Standard ▾]

[Create Renewal Quote →]
```

**"Clone from prior signed quote" option:**
When the rep selects this option instead of "Generate from Contract Subscriptions", the system:
1. Presents a dropdown of the last 3 Accepted/Contracted quotes for this account
2. On selection, shows a preview: quote number, products, ARR, signed date
3. On "Create Renewal Quote": clones the selected quote into a new Draft quote with type = `Renewal`, new quote number, cleared approval history, and start date = day after current contract end
4. Useful when the prior signed quote has custom line notes, non-standard products, or a pricing structure that differs from the current contract (e.g., the contract was amended multiple times and the subscription list is messy)
5. The rep then adjusts prices/quantities as needed before going through approval

**Step 2: Renewal Quote Created:**
- System creates a new Quote with type = `Renewal`
- All active subscription products pre-populated as lines
- Quantities = current contracted quantities
- Prices = contracted prices (or uplifted, depending on pricing method selection)
- Start date = day after current contract end date
- Opportunity created (or existing renewal opportunity linked)
- Rep and CSM assigned from original contract

**Pricing methods:**
- `Same`: Renewal price = exact contracted price (no change)
- `Uplift`: Renewal price = contracted price × (1 + uplift%) — uses the Global Settings uplift (default 5%) but editable per renewal
- `New List`: Renewal price = current price from price book (customer pays current rates)

The rep then opens the Quote Line Editor to adjust products, quantities, or discounts as needed, then goes through the standard approval → document → e-signature flow.

### 3. Renewal Quote Indicators

On a Renewal Quote (type = `Renewal`), the Quote Line Editor shows extra context per line:

```
Product         Contracted Qty  Contracted Price  Renewal Price  Change
PT Core           1             $34,999           $36,749        +5% ↑ (uplift)
PPQ Module        1             $12,999           $13,649        +5% ↑ (uplift)
SSO Integration   1              $5,999            $5,999        No change
```

- If the rep changes prices or quantities, those are highlighted as "changes from contracted"
- A summary shows total ARR change: "Renewal ARR: $56,397 vs. Contracted ARR: $53,997 (+4.4%)"

### 4. Renewal Status Tracking

On each contract (in TASK-133 Renewal Tab):
- `renewalStatus`: `Not Started`, `Quoted`, `Negotiating`, `Won`, `Churned`
- `renewalOpportunity`: linked opportunity
- `renewalQuote`: linked quote
- `renewalNotes`: free text (CSM editable)

CSM can manually update renewal status and risk rating.

**Renewal Won:**
- Renewal Quote accepted → Renewal Order activated → New Contract created
- New contract's `startDate` = day after original `endDate`
- Original contract status → `Expired` (replaced by new contract)
- ARR is counted as retained (not new)

**Renewal Churned:**
- CSM marks renewal as Churned
- Creates `Churn` activity record with reason (required)
- Original contract status → `Churned` on expiry
- ARR waterfall chart shows this as ARR loss

### 5. Automated Renewal Opportunity Creation

When `Contract.renewalForecast = true` (controlled by Global Settings default):
- System automatically creates a `Renewal` Opportunity 90 days before contract end date
- Opportunity Name: "Renewal — [Account Name] — [Contract End Date]"
- Opportunity Stage: `Renewal` (or configured stage)
- Opportunity Close Date: 14 days before contract end date
- Opportunity Amount: Current contracted ARR (before uplift)
- Assigned to: same rep as the original contract

The CSM can then trigger the Renewal Quote from the Opportunity or Contract record.

### 6. Renewal Metrics

On the Renewal Queue page, aggregate metrics:

```
Renewal Pipeline Health:
  Scheduled Renewals (next 90 days): 12 contracts / $890K ARR
  Renewal Quotes Sent:               5 contracts / $420K ARR
  Renewing this Month:               2 contracts / $98K ARR
  Churned (YTD):                     1 contract / $45K ARR
  NRR (Rolling 12-month):            114%
```

---

## UX Requirements

- Renewal Queue is a primary navigation item for CSMs (accessible from the main nav)
- "Start Renewal" should take < 60 seconds to create the renewal quote
- Renewal quote creation is non-blocking — confirmation screen, then rep proceeds at their own pace
- Red urgent indicators must be visually distinct — CSMs should feel urgency for < 30-day renewals
- Email digest: CSMs receive a weekly "Renewal Digest" email showing their upcoming renewals

---

## Definition of Success

- [ ] Renewal queue shows all contracts expiring in the next 90 days
- [ ] Health scores are calculated and color-coded correctly based on days-to-renewal
- [ ] "Start Renewal" creates a Renewal quote with all subscription products pre-populated in < 5 seconds
- [ ] Uplift pricing correctly applies 5% (or configured %) to contracted prices
- [ ] Renewal quote ARR is correctly compared to contracted ARR showing the delta
- [ ] Renewal opportunity is auto-created 90 days before contract expiry (when configured)
- [ ] Churning a renewal creates a Churn record with reason and updates ARR waterfall

---

## Method to Complete

### Backend
1. `RenewalService`:
   - `getRenewalQueue(filters)` — returns contracts approaching expiry with health scores
   - `calculateHealthScore(contractId)` — composite score: days-to-renewal, usage data, ticket history
   - `createRenewalQuote(contractId, renewalSettings)` — generates renewal quote from contract subscriptions
   - `markRenewalWon(quoteId, contractId)` — creates new contract, marks old as Expired
   - `markRenewalChurned(contractId, reason)` — marks contract as Churned
2. `RenewalAutoCreateJob` — nightly cron that creates renewal opportunities at 90-day mark
3. `RenewalDigestJob` — weekly email digest to CSMs
4. Routes:
   - `GET /cpq/renewals` — renewal queue
   - `POST /cpq/contracts/:id/create-renewal-quote` — start renewal
   - `PATCH /cpq/contracts/:id/renewal-status` — update status manually

### Frontend
1. `RenewalQueuePage.tsx` — queue table with filters and summary strip
2. `RenewalStartModal.tsx` — modal for renewal setup
3. `RenewalQuoteContext.tsx` — shows contracted vs. renewal pricing comparison in line editor
4. `RenewalStatusPanel.tsx` — on contract detail, renewal tab
5. `RenewalMetricsSummary.tsx` — dashboard metrics
6. `useRenewalQueue` hook

---

## Acceptance Criteria

- AC1: Renewal queue displays all contracts expiring in the next 90 days (not past, not future beyond 90)
- AC2: Health score correctly turns red for contracts within 30 days with no renewal quote
- AC3: Renewal quote has type = `Renewal`, all contracted products pre-populated
- AC4: Uplift pricing: contracted price $34,999 × 1.05 = $36,749 on renewal quote
- AC5: Renewal opportunity is auto-created exactly 90 days before contract end date
- AC6: Marking renewal as Churned with a reason creates the Churn record and updates contract status
- AC7: NRR metric is calculated correctly (sum of renewal ARR + expansion ARR) ÷ beginning ARR

---

## Dependencies

- TASK-132 (Quote-to-Contract) — contracts exist; subscriptions are source for renewal lines
- TASK-133 (Contract Management) — renewal tab shown here
- TASK-126 (Quote Builder) — renewal quote follows same flow
- TASK-139 (Contract Lifecycle) — service layer

---

## Estimated Effort
**Backend:** 3 days | **Frontend:** 4 days | **Testing:** 1 day
**Total:** 8 days
