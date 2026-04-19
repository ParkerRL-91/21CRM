---
title: Pipeline Movement View Engine
id: TASK-106
project: PRJ-005
status: in-progress
priority: P1
created: 2026-04-18
updated: 2026-04-18
tags: [#task, #pipeline]
---

# TASK-106: Pipeline Movement View Engine

## User Stories
- As a sales manager, I want to see which deals entered/exited/changed stage in a given week so I can understand pipeline velocity.

## Outcomes
A pure engine that takes a list of deal snapshots for two points in time and returns: adds, losses, closed-won, and stage changes, all broken down by rep.

## Success Metrics
- [ ] `computePipelineMovement` returns correct adds/losses/closedWon/stageChanges
- [ ] Rep breakdown matches per-rep aggregations
- [ ] Tests pass

## Implementation Plan
1. Define `DealSnapshot` type (id, ownerId, ownerName, stage, amount, date)
2. Compare start vs end snapshots
3. Categorize: new (in end but not start), lost (in start, not end, not won), won (stage = closed_won in end), moved (same deal, different stage)
4. Aggregate totals + per-rep breakdown

## Files to Change
- `src/lib/pipeline/pipeline-movement.ts` — new engine
- `src/lib/pipeline/pipeline-movement.test.ts` — tests

## Status Log
- 2026-04-18: Created and started

## Takeaways
