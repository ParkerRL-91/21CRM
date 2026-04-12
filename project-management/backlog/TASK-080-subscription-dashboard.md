---
title: "Global subscription dashboard (ARR metrics, expiring subs)"
id: TASK-080
project: PRJ-003
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #subscriptions, #dashboard]
---

# TASK-080: Global subscription dashboard

## User Stories
- As a CS manager, I want a consolidated view of all subscriptions across all accounts with MRR/ARR metrics.

## Outcomes
Dashboard at `/subscriptions` showing: total active count, total ARR, total MRR, ARR by product, ARR by segment. Expiring subscriptions list (30/60/90 days). Net revenue retention rate.

## Success Metrics
- [ ] Subscription dashboard at `/subscriptions`
- [ ] Metric cards: total active, total ARR, total MRR
- [ ] ARR by product chart
- [ ] Expiring subscriptions list (30/60/90 day windows)
- [ ] Net revenue retention rate displayed

## Files to Change
- `src/app/(dashboard)/subscriptions/page.tsx` — NEW (or MODIFY existing)
- `src/app/api/subscriptions/metrics/route.ts` — NEW
- `src/components/subscriptions/subscription-metrics.tsx` — NEW
- `src/components/subscriptions/expiring-subscriptions-table.tsx` — NEW
