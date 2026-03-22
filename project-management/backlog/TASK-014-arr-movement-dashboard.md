---
title: "ARR Movement Dashboard (New, Churn, Expansion, Contraction)"
id: TASK-014
project: PRJ-001
status: ready
priority: P2
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #rev-rec, #subscriptions, #analytics]
---

# TASK-014: ARR Movement Dashboard

## User Stories

- As a SaaS CFO, I want to see my ARR broken down by movement type — new business, expansion, contraction, and churn — so I can understand the health of my recurring revenue base.
- As a revenue leader, I want to track net revenue retention (NRR) month-over-month with the components that drive it.

## Outcomes

1. Subscriptions or analytics page shows ARR movement chart:
   - **New ARR**: from new closed-won deals this period
   - **Expansion**: deals where amount increased (upsell/cross-sell)
   - **Contraction**: deals where amount decreased (downgrade)
   - **Churn**: deals lost / not renewed
   - **Net ARR Change**: new + expansion - contraction - churn
2. Movement shown as a waterfall chart (month-over-month)
3. NRR percentage calculated and displayed: `(starting ARR + expansion - contraction - churn) / starting ARR`
4. Drill-down: click any segment to see the deals driving that movement

## Success Metrics

- [ ] ARR movement computed from deal history and subscription data
- [ ] At least 4 categories displayed (new, expansion, contraction, churn)
- [ ] NRR percentage calculated correctly
- [ ] Waterfall chart shows month-over-month trend
- [ ] Each segment is clickable → shows underlying deals

## Implementation Plan

1. Create `/api/analytics/arr-movement` endpoint
2. Query `crm_objects` for deals by period, categorize by:
   - New: first-time closed-won deals for a company
   - Expansion: `property_change_log` where amount increased on a renewal deal
   - Contraction: amount decreased on a renewal deal
   - Churn: deals marked closed-lost where a prior deal was closed-won
3. Build waterfall visualization with running total
4. Add to subscriptions page or analytics page

## Files to Change

- `src/app/api/analytics/arr-movement/route.ts` — NEW: ARR movement computation
- `src/app/(dashboard)/subscriptions/page.tsx` or `analytics/page.tsx` — add ARR movement section
- `src/components/charts/bar-chart.tsx` — extend for waterfall rendering mode

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-14 (HubiFi core feature).

## Takeaways

_To be filled during execution_
