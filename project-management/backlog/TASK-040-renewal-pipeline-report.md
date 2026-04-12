---
title: "Renewal pipeline report page"
id: TASK-040
project: PRJ-002
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #analytics, #reporting]
---

# TASK-040: Renewal pipeline report page

## User Stories

- As a **Sales Manager**, I want a renewal pipeline report showing total renewal value, renewal rate, at-risk renewals, and churned contracts so that I can forecast recurring revenue accurately.
- As a **Finance user**, I want to understand renewal health across the portfolio so that I can project revenue retention.

## Outcomes

A dedicated renewal analytics page at `/renewals` that provides comprehensive visibility into renewal pipeline health with key metrics, trend charts, and a detailed contract renewal list.

## Success Metrics

- [ ] Renewal report page accessible at `/renewals`
- [ ] Key metric cards: Total Renewal Value, Renewal Rate, At-Risk Count, Churned Value
- [ ] Renewal rate calculated: (renewed contracts / total eligible contracts) × 100
- [ ] Net Revenue Retention displayed: (Renewed ARR + Expansion) / Original ARR × 100
- [ ] Gross Revenue Retention displayed: Renewed ARR / Original ARR × 100
- [ ] Renewal pipeline table: account, contract value, expiration date, renewal status, stage, owner
- [ ] Filterable by: date range, owner, status, risk level
- [ ] Sortable by any column
- [ ] Renewal trend chart: monthly renewal value over time (renewed vs churned)
- [ ] Export to CSV capability
- [ ] Data refreshes automatically (no manual generate step)

## Implementation Plan

### Renewal Metrics API

`GET /api/renewals/metrics?period=Q2-2026`

Response:

```typescript
interface RenewalMetrics {
  // Summary
  totalRenewableValue: number;        // total value of contracts up for renewal in period
  totalRenewedValue: number;          // value of contracts that renewed
  totalChurnedValue: number;          // value of contracts that churned
  totalAtRiskValue: number;           // value of at-risk renewals
  pendingRenewalValue: number;        // value of renewals still in progress
  
  // Rates
  grossRenewalRate: number;           // renewedValue / renewableValue * 100
  netRevenueRetention: number;        // (renewed + expansion) / original * 100
  grossRevenueRetention: number;      // renewed / original * 100 (no expansion credit)
  
  // Counts
  totalRenewableContracts: number;
  renewedContracts: number;
  churnedContracts: number;
  atRiskContracts: number;
  pendingContracts: number;
  
  // Trend data (last 12 months)
  monthlyTrend: Array<{
    month: string;           // "2026-01"
    renewableValue: number;
    renewedValue: number;
    churnedValue: number;
    renewalRate: number;
  }>;
}
```

### Page Layout

```
Renewal Pipeline
────────────────────────────────────────────────
Period: [Q2 2026 ▼]   Owner: [All ▼]   Status: [All ▼]

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Renewable    │  │ Renewal Rate │  │ At-Risk      │  │ Churned      │
│ $2.4M       │  │ 87%          │  │ 3 ($180K)    │  │ 2 ($95K)     │
│ 28 contracts│  │ ↑ 2% vs Q1   │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Net Revenue Retention: 112%                                          │
│ ████████████████████████████████████████████████████████████████░░░░ │
│ [Renewed: $2.09M] [Expansion: +$288K] [Contraction: -$45K]          │
│ [Churn: -$95K]                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Renewal Trend (12 Months)                                            │
│                                                                       │
│  [Bar chart: monthly renewed vs churned value]                       │
│  [Line overlay: renewal rate %]                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Renewal Details                                                [CSV] │
│                                                                       │
│ Account          Value    Expires     Status      Stage      Owner   │
│ Acme Corp       $120K    Jun 30      Renewed     ✓ Won      Jane S  │
│ Beta Inc        $85K     Jul 15      In Progress Negotiate  John D  │
│ Gamma Ltd       $45K     Jul 31      At Risk     Stalled    Jane S  │
│ Delta Co        $95K     Aug 15      Churned     Lost       Mike R  │
└──────────────────────────────────────────────────────────────────────┘
```

### NRR Calculation

```typescript
export function calculateNRR(
  startingARR: Decimal,
  renewedARR: Decimal,
  expansionARR: Decimal,
  contractionARR: Decimal,
  churnARR: Decimal
): Decimal {
  // NRR = (Starting + Expansion - Contraction - Churn) / Starting * 100
  return renewedARR
    .plus(expansionARR)
    .minus(contractionARR)
    .minus(churnARR)
    .dividedBy(startingARR)
    .times(100)
    .toDecimalPlaces(1);
}
```

## Files to Change

- `src/app/(dashboard)/renewals/page.tsx` — **NEW**: Renewal pipeline report page
- `src/app/api/renewals/metrics/route.ts` — **NEW**: Renewal metrics endpoint
- `src/components/renewals/renewal-metrics-cards.tsx` — **NEW**: Key metric cards
- `src/components/renewals/renewal-trend-chart.tsx` — **NEW**: Monthly trend chart
- `src/components/renewals/renewal-detail-table.tsx` — **NEW**: Contract renewal list
- `src/components/renewals/nrr-bar.tsx` — **NEW**: NRR waterfall visualization
- `src/lib/renewals/metrics.ts` — **NEW**: Metrics computation logic
- `src/lib/renewals/metrics.test.ts` — **NEW**: Metrics calculation tests

## Status Log

- 2026-04-12: Created — implements US-8.3 reporting requirements

## Takeaways

_To be filled during implementation._
