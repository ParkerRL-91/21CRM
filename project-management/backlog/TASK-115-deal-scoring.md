---
title: Deal Scoring Engine + Tests
id: TASK-115
project: PRJ-005
status: in-progress
priority: P1
created: 2026-04-18
updated: 2026-04-18
tags: [#task, #pipeline]
---

# TASK-115: Deal Scoring Engine + Tests

## User Stories
- As a sales manager, I want each deal to have a health score based on 6 factors so reps can prioritize their follow-up.

## Outcomes
Engine that scores deals 0-100 across 6 factors: engagement, stage fit, close date health, deal size, activity recency, and relationship strength.

## Success Metrics
- [ ] All 6 scoring factors are covered
- [ ] Benchmarks produce correct output
- [ ] Tests cover each factor independently + composite score
- [ ] Tests pass

## Files to Change
- `src/lib/pipeline/deal-scoring.ts`
- `src/lib/pipeline/deal-scoring.test.ts`

## Status Log
- 2026-04-18: Created and started

## Takeaways
