---
title: "Clickable Drill-Down on Stat Cards (Pipeline + Team Pages)"
id: TASK-101
project: PRJ-005
status: backlog
priority: P0
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #ux, #pipeline, #team, #dashboard, #interactivity]
---

# TASK-101: Clickable Drill-Down on Stat Cards (Pipeline + Team Pages)

## User Stories

- As **Dana (VP RevOps)**, I want to click on the "Total Pipeline" stat card and immediately see every deal that makes up that number so I can drill into specific segments without building a custom report.
- As **Morgan (Sales Manager)**, I want to click on a team member's closed-won metric and see only their closed deals so I can prep for 1:1s with deal-level context in two clicks.
- As **Alex (Sales Rep)**, I want to click on my deal count and see my own deals filtered so I can quickly verify my numbers are correct before a pipeline review.
- As **Jordan (CRM Admin)**, I want drill-down chains to persist across navigation (e.g., filter → drill → back button returns to filtered state) so users don't lose context while exploring.

## Outcomes

1. Every stat card on the pipeline page is clickable — clicking filters the deal table to show only deals matching that metric
2. Every stat card on the team page is clickable — clicking filters to show the relevant rep's deals or that metric's breakdown
3. Chart segments (bar chart sections, funnel stages, pie slices) are clickable and filter the same data table
4. Active filter state is visually indicated: highlighted card border, "Showing X of Y deals" label, and a clear/reset button
5. Filter chains work: click stat card → filter table → click a deal row → see deal detail → back button returns to filtered view
6. Drill-down state persists in URL query params (shareable filtered views)

## Success Metrics

- [ ] Pipeline page: all stat cards (total pipeline, closed-won, avg deal size, deal count, weighted pipeline) trigger drill-down
- [ ] Team page: all per-rep metric cards trigger drill-down to that rep's deals
- [ ] Dashboard page: top-level stat cards trigger drill-down
- [ ] Active filter is visually distinct (highlighted card + count label)
- [ ] Clear/reset button removes all active filters
- [ ] Filter state stored in URL query params (shareable, survives page refresh)
- [ ] No page reload required — client-side filtering with smooth transitions
- [ ] Filter chains work across 3+ levels of drill-down without losing context

## Implementation Plan

1. Create a reusable `DrillDownProvider` context that manages active filter state across a page
2. Create an `InteractiveStatCard` component wrapping existing `MetricCard` with click handler, active state, and visual feedback
3. Create a `DrillDownFilterBar` component that shows active filters and clear button
4. Update the pipeline page:
   - Wrap in `DrillDownProvider`
   - Replace stat cards with `InteractiveStatCard`
   - Wire deal table to filter based on active drill-down
   - Make chart segments clickable (bar chart bars, funnel stages)
5. Update the team page:
   - Per-rep cards drill to that rep's deals
   - Metric cards drill to the metric breakdown
6. Update the dashboard page:
   - Top-level cards drill to filtered views
7. Store filter state in URL search params using `useSearchParams()` for shareability
8. Add keyboard support (Enter/Space to activate cards, Escape to clear filters)

## Files to Change

- `src/components/drill-down/drill-down-provider.tsx` — NEW: React context for drill-down state management
- `src/components/drill-down/interactive-stat-card.tsx` — NEW: clickable stat card wrapper
- `src/components/drill-down/drill-down-filter-bar.tsx` — NEW: active filter display + clear button
- `src/components/drill-down/index.ts` — NEW: barrel export
- `src/components/charts/metric-card.tsx` — extend with `onClick` and `active` props
- `src/components/charts/bar-chart.tsx` — add click handlers to chart segments
- `src/app/(dashboard)/pipeline/page.tsx` — integrate drill-down provider and interactive cards
- `src/app/(dashboard)/team/page.tsx` — integrate drill-down for rep cards
- `src/app/(dashboard)/dashboards/page.tsx` — integrate drill-down for top-level cards

## Tests to Write

- `src/components/drill-down/drill-down-provider.test.ts` — test filter state management, multi-filter combinations, clear behavior
- `src/components/drill-down/interactive-stat-card.test.ts` — test click activation, active state toggle, keyboard support

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #1 (Interactivity). Extends TASK-003 scope with URL persistence, chart segment clicking, and keyboard support.

## Takeaways

_To be filled during execution_
