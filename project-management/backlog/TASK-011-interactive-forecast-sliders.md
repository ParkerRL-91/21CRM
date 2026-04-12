---
title: "Interactive Forecast Sliders (What-If Vision Tool)"
id: TASK-011
project: PRJ-001
status: done
priority: P2
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #forecast, #ux]
---

# TASK-011: Interactive Forecast Sliders

## User Stories

- As a VP Sales, I want to drag sliders to adjust win rate, average deal size, and pipeline coverage and immediately see how the forecast changes so I can model "what if" scenarios without creating separate scenario files.
- As a revenue planner, I want to show the board "if we increase win rate from 25% to 30%, here's the revenue impact" in real time during a meeting.

## Outcomes

1. Forecast page has an interactive panel with sliders for key assumptions:
   - Win rate (%)
   - Average deal size ($)
   - Sales cycle length (days)
   - Pipeline coverage ratio (x)
   - Close rate by stage (%)
2. Moving a slider instantly re-computes the forecast chart below
3. "Reset to actuals" button returns sliders to values computed from real data
4. Can save a slider configuration as a new scenario

## Success Metrics

- [ ] At least 3 sliders that update the forecast in real-time (no page reload)
- [ ] Computation happens client-side for instant response (<100ms)
- [ ] Reset button restores actual values from CRM data
- [ ] Save as scenario creates a new forecast scenario with the adjusted assumptions
- [ ] Slider values show the actual vs adjusted numbers (e.g., "Win Rate: 25% → 35%")

## Implementation Plan

1. Extract the core forecast computation into a client-safe function (no DB calls)
2. Build a slider panel component with debounced re-computation
3. Pre-compute "actuals" from CRM data on page load (win rate, avg deal size, cycle length)
4. Wire sliders to re-run the computation and update the chart
5. Add "Save as Scenario" that POSTs adjusted assumptions to the scenario API

## Files to Change

- `src/lib/forecast/client-compute.ts` — NEW: client-side forecast computation
- `src/components/forecast/slider-panel.tsx` — NEW: interactive slider UI
- `src/app/(dashboard)/forecast/page.tsx` — integrate slider panel with chart
- `src/app/api/forecast/actuals/route.ts` — NEW: compute actual win rate, deal size, etc.

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-11 (Kluster "Vision" tool).

## Takeaways

_To be filled during execution_
