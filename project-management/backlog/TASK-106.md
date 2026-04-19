# TASK-106 — Pipeline Movement Engine (pipeline-movement.ts)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Implement the `pipeline-movement.ts` forecast engine that calculates expected deal movement between pipeline stages over a forecast period, accounting for historical conversion rates and time-in-stage distributions.

## Acceptance Criteria
- `calculatePipelineMovement(deals, historicalRates, forecastPeriodDays)` returns expected stage transitions
- Handles multi-stage funnels with configurable conversion rates per stage pair
- Returns per-deal expected close probability adjusted for stage velocity
- Fully unit tested with deterministic inputs

## Implementation Notes
- File: `packages/twenty-front/src/modules/cpq/engines/pipeline-movement.ts`
- Pure function — no side effects, no external dependencies
- Conversion rates stored as weighted averages of last 90 days of closed deals
