# TASK-108 — Projected RevRec Engine (projected-rev-rec.ts)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Implement the `projected-rev-rec.ts` engine that produces a month-by-month revenue recognition schedule for a contract given its recognition method, term, and value.

## Acceptance Criteria
- Supports recognition methods: straight-line, milestone, percent-complete, usage-based
- `buildRecognitionSchedule(contract, method)` returns array of `{ month, recognized, deferred }`
- Handles mid-month start dates with correct proration of first/last periods
- Total recognized across all periods equals contract TCV (no leakage)
- Unit tested for each recognition method

## Implementation Notes
- File: `packages/twenty-front/src/modules/cpq/engines/projected-rev-rec.ts`
- Uses Decimal.js for precise arithmetic (no floating-point drift)
- Schedule consumed by `RevRecWaterfallChart` (TASK-104)
