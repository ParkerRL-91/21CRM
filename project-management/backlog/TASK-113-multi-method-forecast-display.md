---
title: Multi-Method Forecast Display Engine
id: TASK-113
project: PRJ-005
status: in-progress
priority: P1
created: 2026-04-18
updated: 2026-04-18
tags: [#task, #forecast]
---

# TASK-113: Multi-Method Forecast Display Engine

## User Stories
- As a VP of Sales, I want to see pipeline, historical, and blended forecasts side-by-side so I can sanity-check the number from multiple angles.

## Outcomes
Engine that computes all 3 forecast methods and returns them in a structure ready for side-by-side display.

## Success Metrics
- [ ] Pipeline method: weighted deal sum
- [ ] Historical method: applies historical win rate to open pipeline
- [ ] Blended method: weighted average of pipeline + historical
- [ ] Tests pass

## Files to Change
- `src/lib/pipeline/multi-method-forecast.ts`
- `src/lib/pipeline/multi-method-forecast.test.ts`

## Status Log
- 2026-04-18: Created and started

## Takeaways
