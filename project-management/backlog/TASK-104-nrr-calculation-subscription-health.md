---
title: "NRR Calculation Engine + Subscription Health Dashboard"
id: TASK-104
project: PRJ-005
status: backlog
priority: P0
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #subscriptions, #analytics, #rev-rec, #arr, #nrr]
---

# TASK-104: NRR Calculation Engine + Subscription Health Dashboard

## User Stories

- As **Dana (VP RevOps)**, I want NRR (Net Revenue Retention) calculated from actual line-item data — not from a single company-level ARR field — so I can report an accurate number to the board that shows our true expansion/contraction picture.
- As **Casey (Finance/Controller)**, I want to see ARR movement broken down into New, Expansion, Contraction, and Churn buckets so I can reconcile subscription revenue changes month-over-month and explain variances to the CFO.
- As **Morgan (Sales Manager)**, I want a subscription health dashboard showing which accounts are expanding and which are at risk of contraction so I can prioritize CS handoffs and upsell opportunities for my team.
- As **Jordan (CRM Admin)**, I want the NRR calculation to work automatically from synced HubSpot line items without requiring manual data entry so the dashboards stay current after every sync.

## Outcomes

1. An NRR calculation engine that computes Net Revenue Retention from line-item-level subscription data
2. ARR movement categories: **New ARR** (new customers), **Expansion ARR** (existing customer upsells/cross-sells), **Contraction ARR** (downgrades), **Churn ARR** (lost customers), **Net New ARR** = New + Expansion - Contraction - Churn
3. NRR formula: (Starting ARR + Expansion - Contraction - Churn) / Starting ARR
4. Subscription health dashboard page showing:
   - NRR percentage (current period and trailing 12 months)
   - ARR movement waterfall chart (New + Expansion - Contraction - Churn)
   - Account-level health indicators (expanding, stable, contracting, churned)
   - Cohort view: NRR by customer cohort (signup quarter)
5. All calculations derived from crm_objects line items with recurring billing periods

## Success Metrics

- [ ] NRR calculated correctly from line-item data (verified against manual calculation on test data)
- [ ] ARR movement shows New, Expansion, Contraction, Churn buckets with dollar amounts
- [ ] NRR displayed as percentage with period selector (monthly, quarterly, trailing 12 months)
- [ ] Subscription health page loads within 2 seconds for 500+ accounts
- [ ] Account-level health status computed (expanding/stable/contracting/churned)
- [ ] Cohort NRR view shows retention by customer signup quarter
- [ ] Works with HubSpot line items that have hs_recurring_billing_period set
- [ ] Handles edge cases: accounts with no line items, one-time-only revenue, mid-period changes
- [ ] Unit tests cover all NRR scenarios including 100% retention, net expansion, net contraction

## Implementation Plan

1. Create `src/lib/subscriptions/nrr-engine.ts`:
   - `computeARRFromLineItems(lineItems, asOfDate)` — calculate current ARR from active subscriptions
   - `computeARRMovement(periodStart, periodEnd, lineItems, associations)` — categorize changes into New/Expansion/Contraction/Churn
   - `computeNRR(startingARR, expansion, contraction, churn)` — simple NRR calculation
   - `computeAccountHealth(accounts, lineItems, periods)` — per-account health status
   - `computeCohortNRR(accounts, lineItems, cohortField)` — NRR by customer cohort
2. Create `src/app/api/subscriptions/health/route.ts`:
   - GET: returns NRR, ARR movement, and account health data
   - Query params: period (month/quarter), dateRange
   - Joins crm_objects (companies) with crm_objects (line_items) via deal associations
3. Create/update subscription health page:
   - NRR headline metric with period selector
   - ARR movement waterfall chart component
   - Account health table with status badges
   - Cohort NRR grid
4. Integrate with existing subscriptions page (`src/app/(dashboard)/subscriptions/page.tsx`)

## Files to Change

- `src/lib/subscriptions/nrr-engine.ts` — NEW: NRR and ARR movement calculation engine
- `src/lib/subscriptions/nrr-engine.test.ts` — NEW: comprehensive unit tests
- `src/lib/subscriptions/nrr-types.ts` — NEW: TypeScript interfaces for ARR movement, health status, cohorts
- `src/app/api/subscriptions/health/route.ts` — NEW: API endpoint for subscription health data
- `src/app/(dashboard)/subscriptions/page.tsx` — enhance with NRR metrics, ARR movement, account health
- `src/components/subscriptions/nrr-metric-card.tsx` — NEW: NRR display with period selector
- `src/components/subscriptions/arr-movement-chart.tsx` — NEW: waterfall chart for ARR movement
- `src/components/subscriptions/account-health-table.tsx` — NEW: account-level health status table
- `src/components/subscriptions/cohort-nrr-grid.tsx` — NEW: cohort retention grid

## Tests to Write

- `src/lib/subscriptions/nrr-engine.test.ts`:
  - ARR from line items: correctly annualizes monthly, quarterly, annual subscriptions
  - ARR from line items: excludes one-time (non-recurring) items
  - ARR movement: correctly categorizes new customer ARR
  - ARR movement: correctly categorizes expansion (same account, higher ARR)
  - ARR movement: correctly categorizes contraction (same account, lower ARR)
  - ARR movement: correctly categorizes churn (account with ARR → no ARR)
  - NRR calculation: 100% retention (no changes)
  - NRR calculation: net expansion (>100%)
  - NRR calculation: net contraction (<100%)
  - NRR calculation: handles zero starting ARR gracefully
  - Account health: classifies expanding, stable, contracting, churned correctly
  - Cohort NRR: groups accounts by signup period and computes per-cohort NRR
  - Edge cases: accounts with mixed recurring and one-time items, mid-period subscription changes

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #6 (Subscription Health). Related to TASK-023 (ARR from line items) and TASK-014 (ARR movement dashboard) in PRJ-001.

## Takeaways

_To be filled during execution_
