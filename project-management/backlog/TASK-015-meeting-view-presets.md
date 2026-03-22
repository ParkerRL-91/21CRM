---
title: "Meeting-Centric View Presets"
id: TASK-015
project: PRJ-001
status: ready
priority: P3
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #dashboard, #ux]
---

# TASK-015: Meeting-Centric View Presets

## User Stories

- As a sales manager, I want a "1:1 Prep" dashboard preset that shows my rep's pipeline, recent activity, at-risk deals, and quota attainment so I can prepare for 1:1s in 30 seconds.
- As a VP Sales, I want a "Forecast Call" preset that shows the forecast, pipeline coverage, key changes, and commit vs best case so the weekly forecast call runs efficiently.
- As a CRO, I want a "Board Pack" preset with quarterly revenue, ARR trends, forecast accuracy, and pipeline health for board presentations.

## Outcomes

1. Dashboard page has a preset selector: "Custom" | "1:1 Prep" | "Forecast Call" | "Board Pack"
2. Each preset configures which widgets/cards are shown and in what order
3. Presets are read-only templates — users can clone to customize
4. "1:1 Prep" includes: rep filter, pipeline by stage, at-risk deals, activity summary, quota progress
5. "Forecast Call" includes: forecast triangulation, pipeline coverage, movement, commit vs best case
6. "Board Pack" includes: quarterly revenue, ARR trend, NRR, forecast accuracy, pipeline health

## Success Metrics

- [ ] At least 3 presets available
- [ ] Switching presets reconfigures the dashboard without page reload
- [ ] Each preset shows relevant, focused data (not just "show everything")
- [ ] Users can filter presets by rep/team where applicable

## Implementation Plan

1. Define preset configurations as JSON structures (which widgets, which filters, which layout)
2. Store in a constants file or `app_config`
3. Add preset selector to dashboard header
4. Dashboard renders widgets based on active preset configuration
5. Clone-to-customize creates a new dashboard entry in the DB

## Files to Change

- `src/lib/dashboard/presets.ts` — NEW: preset configurations
- `src/app/(dashboard)/dashboards/page.tsx` — add preset selector and dynamic rendering
- `src/components/dashboard/preset-selector.tsx` — NEW: preset picker UI

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-15 (Kluster meeting workflow).

## Takeaways

_To be filled during execution_
