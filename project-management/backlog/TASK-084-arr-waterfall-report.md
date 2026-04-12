---
title: "ARR waterfall report"
id: TASK-084
project: PRJ-003
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #reporting, #arr]
---

# TASK-084: ARR waterfall report

## User Stories
- As a Finance user, I want an ARR waterfall showing beginning/new/expansion/contraction/churn/ending ARR for a period so I can explain revenue changes to leadership.

## Outcomes
Report: Beginning ARR + New + Expansion - Contraction - Churn = Ending ARR. Each component drillable to underlying contracts/subscriptions. Monthly or quarterly. CSV export.

## Success Metrics
- [ ] ARR waterfall at `/analytics/arr-waterfall`
- [ ] Formula: Beginning + New + Expansion - Contraction - Churn = Ending
- [ ] Each component drillable to source contracts
- [ ] Monthly and quarterly periods
- [ ] Waterfall visualization (stacked bar chart)
- [ ] CSV export

## Implementation Plan
- New ARR: from contracts created in period
- Expansion: from amendment quotes with positive delta in period
- Contraction: from amendment quotes with negative delta in period
- Churn: from contracts that expired/cancelled without renewal in period
- Beginning ARR: ending ARR of prior period

## Files to Change
- `src/app/(dashboard)/analytics/arr-waterfall/page.tsx` — NEW
- `src/app/api/analytics/arr-waterfall/route.ts` — NEW
- `src/lib/analytics/arr-waterfall.ts` — NEW: Calculation logic
- `src/lib/analytics/arr-waterfall.test.ts` — NEW
- `src/components/analytics/waterfall-chart.tsx` — NEW
