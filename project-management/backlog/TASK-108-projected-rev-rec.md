---
title: Projected Rev-Rec Engine + Tests
id: TASK-108
project: PRJ-005
status: in-progress
priority: P1
created: 2026-04-18
updated: 2026-04-18
tags: [#task, #rev-rec, #pipeline]
---

# TASK-108: Projected Rev-Rec Engine + Tests

## User Stories
- As a RevOps analyst, I want to see projected revenue recognition that includes closed deals, weighted pipeline, and open quotes so I can forecast monthly recognized revenue accurately.

## Outcomes
Engine with 3 modes: closed-only, closed+pipeline, closed+pipeline+quotes. Each mode produces monthly recognized revenue schedule.

## Success Metrics
- [ ] Closed-only mode sums only won deal schedules
- [ ] Pipeline mode adds probability-weighted amounts
- [ ] Quotes mode adds quote-probability-weighted amounts
- [ ] Tests cover all 3 modes

## Files to Change
- `src/lib/pipeline/projected-rev-rec.ts`
- `src/lib/pipeline/projected-rev-rec.test.ts`

## Status Log
- 2026-04-18: Created and started

## Takeaways
