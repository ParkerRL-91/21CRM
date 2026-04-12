---
title: "Discount analysis report"
id: TASK-082
project: PRJ-003
status: done
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #reporting, #discounts]
---

# TASK-082: Discount analysis report

## User Stories
- As a Finance user, I want a discount analysis report showing average discount by product, rep, and segment so I can identify margin erosion.

## Outcomes
Report showing avg/median discount %, discount distribution histogram, total discount value. Groupable by product, family, rep, segment, period. Flagged outliers. CSV export.

## Success Metrics
- [ ] Discount report at `/analytics/discounts`
- [ ] Average/median discount %, distribution histogram
- [ ] Group by: product, family, rep, segment, period
- [ ] Flagged outliers above threshold
- [ ] CSV export

## Files to Change
- `src/app/(dashboard)/analytics/discounts/page.tsx` — NEW
- `src/app/api/analytics/discounts/route.ts` — NEW
