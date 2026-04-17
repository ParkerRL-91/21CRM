---
title: "Multi-Method Forecast Display"
id: TASK-113
project: PRJ-005
status: backlog
priority: P2
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #forecast, #analytics, #methodology, #accuracy]
---

# TASK-113: Multi-Method Forecast Display

## User Stories

- As **Dana (VP RevOps)**, I want to see forecasts from multiple methods side-by-side (pipeline-based, historical trend, rep-submitted, and manager-adjusted) so I can triangulate between approaches and present a range to the board instead of a single point estimate.
- As **Morgan (Sales Manager)**, I want to see how my team's pipeline-based forecast compares to the historical trend forecast so I can identify when my team's pipeline is weaker or stronger than our historical close rates would suggest.
- As **Casey (Finance/Controller)**, I want to see a weighted blend of forecast methods with confidence intervals so I can use the most reliable estimate for financial planning and communicate uncertainty appropriately to the CFO.
- As **Alex (Sales Rep)**, I want to see how the system's forecast for my territory compares to my own submitted forecast so I can calibrate my forecasting skills and understand if I'm consistently over- or under-calling.

## Outcomes

1. Forecast page shows multiple forecast methods simultaneously:
   - **Pipeline-based**: weighted pipeline by forecast category (existing)
   - **Historical trend**: projection based on same-period-prior-year or trailing average
   - **Rep-submitted**: manual forecast calls from reps (if submitted)
   - **Manager-adjusted**: manager overrides of rep forecasts
   - **Blended/weighted**: configurable weighted average of methods
2. Side-by-side comparison table: each method's forecast for the same period
3. Confidence range visualization: show range from most conservative to most aggressive method
4. Accuracy tracking per method: which method has been most accurate historically
5. Method configuration: weights and inclusion toggleable from settings

## Success Metrics

- [ ] At least 3 forecast methods displayed simultaneously (pipeline, historical, blended)
- [ ] Side-by-side table shows each method's forecast for current quarter
- [ ] Confidence range shown visually (min to max across methods)
- [ ] Historical accuracy per method displayed (when snapshot data exists)
- [ ] Method weights configurable from forecast settings
- [ ] Blended forecast computed from configured weights
- [ ] Works with existing forecast engine infrastructure
- [ ] Clear visual design: methods distinguishable by color/label
- [ ] Unit tests cover blended forecast computation and accuracy calculations

## Implementation Plan

1. Create `src/lib/forecast/multi-method-engine.ts`:
   - `computeHistoricalTrendForecast(closedDeals, periods, currentPeriod)` — project from historical patterns
   - `computePipelineForecast(openDeals, forecastCategories)` — existing pipeline-based (may wrap existing)
   - `computeBlendedForecast(methods, weights)` — weighted average of multiple methods
   - `computeMethodAccuracy(methodForecasts, actuals)` — historical accuracy per method
   - `computeConfidenceRange(methods)` — min/max/median across methods
2. Create `src/app/api/forecast/multi-method/route.ts`:
   - GET: returns all forecast methods for a period
   - Query params: period (quarter), scenarioId
   - Returns each method's result with metadata
3. Create multi-method UI components:
   - `MultiMethodTable` — side-by-side comparison table
   - `ConfidenceRangeChart` — visual range from conservative to aggressive
   - `MethodAccuracyChart` — accuracy trend per method
   - `MethodWeightConfig` — settings for adjusting method weights
4. Integrate into forecast page as a "Methods" tab or section

## Files to Change

- `src/lib/forecast/multi-method-engine.ts` — NEW: multi-method forecast computation
- `src/lib/forecast/multi-method-engine.test.ts` — NEW: unit tests
- `src/lib/forecast/multi-method-types.ts` — NEW: types for methods, accuracy, confidence ranges
- `src/app/api/forecast/multi-method/route.ts` — NEW: API endpoint for multi-method forecast
- `src/app/(dashboard)/forecast/page.tsx` — add Methods tab/section with comparison UI
- `src/components/forecast/multi-method-table.tsx` — NEW: side-by-side method comparison
- `src/components/forecast/confidence-range-chart.tsx` — NEW: range visualization
- `src/components/forecast/method-accuracy-chart.tsx` — NEW: accuracy trend per method
- `src/app/(dashboard)/settings/page.tsx` — add forecast method weight configuration

## Tests to Write

- `src/lib/forecast/multi-method-engine.test.ts`:
  - Historical trend: correctly projects from same-quarter-prior-year data
  - Historical trend: handles missing historical data gracefully (falls back to trailing average)
  - Pipeline forecast: correctly weights by forecast category
  - Blended forecast: weighted average computed correctly with custom weights
  - Blended forecast: handles zero-weight methods (excluded from average)
  - Method accuracy: correctly computes MAPE for each method against actuals
  - Method accuracy: handles methods with no historical data (no accuracy score)
  - Confidence range: min/max/median correctly computed across methods
  - Edge cases: single method (no range), all methods agree (zero range)
  - Normalization: weights that don't sum to 100% are normalized automatically

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #4 (Forecast Accountability). Extends TASK-010 (multi-method display) from PRJ-001 with accuracy tracking and confidence ranges.

## Takeaways

_To be filled during execution_
