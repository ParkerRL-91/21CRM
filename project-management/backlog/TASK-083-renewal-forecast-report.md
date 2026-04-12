---
title: "Renewal forecast report"
id: TASK-083
project: PRJ-003
status: done
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #reporting, #renewals]
---

# TASK-083: Renewal forecast report

## User Stories
- As a Sales Manager, I want a renewal forecast showing upcoming renewals, values, and likelihood so I can project recurring revenue.

## Outcomes
Report listing contracts expiring within configurable window (default 12 months). Shows account, value, expiration, renewal quote status, opportunity stage, CS manager. Summary: total at risk, renewed, churned. CSV export.

## Success Metrics
- [ ] Renewal forecast at `/analytics/renewal-forecast`
- [ ] Configurable window (default 12 months)
- [ ] Per-row: account, value, expiration, renewal status, stage, owner
- [ ] Summary: total renewal value at risk, renewed, churned
- [ ] CSV export

## Files to Change
- `src/app/(dashboard)/analytics/renewal-forecast/page.tsx` — NEW
- `src/app/api/analytics/renewal-forecast/route.ts` — NEW
