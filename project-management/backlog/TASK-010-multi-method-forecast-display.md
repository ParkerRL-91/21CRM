---
title: "Multi-Method Forecast Display (Triangulation)"
id: TASK-010
project: PRJ-001
status: done
priority: P2
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #forecast, #ux]
---

# TASK-010: Multi-Method Forecast Display

## User Stories

- As a revenue leader, I want to see the same forecast computed 3 different ways side-by-side so I can triangulate and build confidence when methods agree.
- As a VP Sales, I want to know when my weighted pipeline forecast diverges from the scenario model or historical pacing so I can investigate why.

## Outcomes

1. Forecast page shows 2-3 forecast methods simultaneously:
   - **Weighted Pipeline**: sum of (deal amount × stage probability) for deals expected to close in period
   - **Scenario Model**: output from the existing forecast scenario engine
   - **Historical Pacing**: based on same-period-last-year or trailing average close rates
2. Visual confidence indicator when methods agree (green) or diverge (amber/red)
3. Tooltip or detail panel explaining each method's calculation

## Success Metrics

- [ ] At least 2 methods displayed (weighted pipeline + scenario model)
- [ ] Confidence indicator shows when methods are within 10% (agree) vs divergent
- [ ] Each method's number is clickable → shows the underlying calculation
- [ ] Works even if only 1 method has data (graceful degradation)

## Implementation Plan

1. Create a `computeWeightedPipelineForecast()` function — sums open deals × probability for each future month
2. Use existing scenario engine output for the scenario model number
3. Create `/api/forecast/multi-method` endpoint that returns all available methods
4. Add a multi-method comparison card to the forecast summary page
5. Add confidence indicator component

## Files to Change

- `src/lib/forecast/engines/weighted-pipeline.ts` — NEW: weighted pipeline forecast
- `src/app/api/forecast/multi-method/route.ts` — NEW: multi-method endpoint
- `src/app/(dashboard)/forecast/page.tsx` — add triangulation display
- `src/components/forecast/confidence-indicator.tsx` — NEW: agree/diverge visual

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-10 (Kluster's key differentiator).

## Takeaways

_To be filled during execution_
