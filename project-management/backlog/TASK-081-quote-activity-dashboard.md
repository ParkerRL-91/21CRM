---
title: "Quote activity dashboard"
id: TASK-081
project: PRJ-003
status: done
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #reporting, #quotes]
---

# TASK-081: Quote activity dashboard

## User Stories
- As a Sales Manager, I want a quote activity dashboard showing quotes created, sent, accepted, and rejected by time period and rep.

## Outcomes
Dashboard showing quote funnel metrics, conversion rates, average deal size, average discount, average cycle length. Filterable by date, rep, product family, segment.

## Success Metrics
- [ ] Quote dashboard at `/analytics/quotes`
- [ ] Metrics: created, sent, accepted, rejected, conversion rate
- [ ] Filters: date range, rep, product family, segment
- [ ] Average deal size, average discount %, average sales cycle
- [ ] Real-time refresh

## Files to Change
- `src/app/(dashboard)/analytics/quotes/page.tsx` — NEW
- `src/app/api/analytics/quotes/route.ts` — NEW
- `src/components/analytics/quote-funnel.tsx` — NEW
