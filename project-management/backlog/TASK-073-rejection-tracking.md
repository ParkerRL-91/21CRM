---
title: "Rejection tracking with reason codes"
id: TASK-073
project: PRJ-003
status: done
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #quotes, #analytics]
---

# TASK-073: Rejection tracking

## User Stories
- As a Sales Rep, I want to record why a quote was rejected so we can improve future proposals.

## Outcomes
Rejection reason picklist (price too high, competitor chosen, budget constraints, timing, other) with optional notes. Data available for reporting.

## Success Metrics
- [ ] Rejection reason picklist on reject action
- [ ] Required reason, optional free-text notes
- [ ] Rejected quotes remain accessible (read-only)
- [ ] Rejection data queryable for analytics (TASK-081)

## Files to Change
- `src/lib/cpq/quote-validation.ts` — MODIFY: Add rejection schema
- `src/components/cpq/rejection-form.tsx` — MODIFY (from TASK-072)
