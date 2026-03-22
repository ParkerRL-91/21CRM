---
title: "Deal Prioritization Bubble Chart"
id: TASK-013
project: PRJ-001
status: ready
priority: P2
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #pipeline, #ux]
---

# TASK-013: Deal Prioritization Bubble Chart

## User Stories

- As a sales manager, I want a visual map of all my deals where I can instantly see which ones are high-value, high-probability, and ready to close vs which are stuck and risky.
- As a VP Sales, I want to identify my "focus deals" — big deals in late stages that need attention — at a glance.

## Outcomes

1. Pipeline page includes a bubble chart where:
   - **Bubble size** = deal amount (bigger = more revenue)
   - **Bubble color** = pipeline stage (green = late stage, red = early)
   - **X-axis** = close probability (left = low, right = high)
   - **Y-axis** = days in current stage (top = stale, bottom = fresh)
2. Hovering a bubble shows deal name, amount, stage, owner, days in stage
3. Clicking a bubble navigates to deal details or opens an inline card
4. Quadrant labels: "Focus" (high value, high prob), "Nurture" (low prob, fresh), "At Risk" (stale, any size), "Quick Wins" (small, high prob)

## Success Metrics

- [ ] Chart renders with real deal data from `crm_objects`
- [ ] At least 4 visual dimensions encoded (size, color, x, y)
- [ ] Hover tooltip shows key deal info
- [ ] Deals with no probability are excluded or shown at x=0
- [ ] Chart handles 100+ deals without performance issues

## Implementation Plan

1. Build a `BubbleChart` component using SVG or a chart library
2. Create `/api/pipeline/bubble-data` that returns deals with amount, probability, days-in-stage, stage
3. Days-in-stage computed from `deal_stage_history` (last stage change to now)
4. Add to pipeline page as a new visualization tab/section

## Files to Change

- `src/components/charts/bubble-chart.tsx` — NEW: bubble chart component
- `src/app/api/pipeline/bubble-data/route.ts` — NEW: bubble data endpoint
- `src/app/(dashboard)/pipeline/page.tsx` — add bubble chart section

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-13 (Clari signature visualization).

## Takeaways

_To be filled during execution_
