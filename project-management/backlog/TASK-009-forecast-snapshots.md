---
title: "Forecast Snapshots (Point-in-Time Freezing)"
id: TASK-009
project: PRJ-001
status: ready
priority: P2
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #forecast, #audit]
---

# TASK-009: Forecast Snapshots

## User Stories

- As a CFO, I want to freeze my forecast at the end of each quarter so I can compare what we predicted vs what actually happened for board reporting.
- As a revenue leader, I want to see how the forecast changed week-over-week so I can identify when deals slipped and hold reps accountable.
- As an auditor, I want an immutable record of what the forecast was at any point in time.

## Outcomes

1. User can click "Take Snapshot" on the forecast page to freeze current forecast data
2. Snapshots are stored as immutable records with timestamp and label (e.g., "Q1 2026 Week 4")
3. Users can view past snapshots and compare side-by-side with current forecast
4. Diff view highlights what changed between two snapshots (deals added, removed, amount changes)

## Success Metrics

- [ ] Snapshots stored in `forecast_scenario_snapshots` table (already exists in schema)
- [ ] At least 3 snapshots can be compared side-by-side
- [ ] Diff view shows deal-level changes between snapshots
- [ ] Snapshots cannot be modified after creation (immutable)
- [ ] UI shows snapshot history with timestamps and labels

## Implementation Plan

1. Wire the existing `forecast_scenario_snapshots` table (already in schema) with a snapshot API
2. Create `POST /api/forecast/scenarios/[id]/snapshot` to freeze current state
3. Create `GET /api/forecast/snapshots` to list snapshots with metadata
4. Create `GET /api/forecast/snapshots/compare` to diff two snapshots
5. Add snapshot controls and history view to the forecast page
6. Add comparison view component

## Files to Change

- `src/app/api/forecast/scenarios/[id]/snapshot/route.ts` — NEW: create snapshot
- `src/app/api/forecast/snapshots/route.ts` — NEW: list/compare snapshots
- `src/app/(dashboard)/forecast/page.tsx` — add snapshot button and history panel
- `src/app/(dashboard)/forecast/compare/page.tsx` — enhance with snapshot comparison

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-09 (Kluster + HubiFi pattern).

## Takeaways

_To be filled during execution_
