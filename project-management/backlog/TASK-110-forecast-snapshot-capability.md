---
title: "Forecast Snapshot Capability"
id: TASK-110
project: PRJ-005
status: backlog
priority: P1
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #forecast, #snapshots, #accountability, #board-reporting]
---

# TASK-110: Forecast Snapshot Capability

## User Stories

- As **Dana (VP RevOps)**, I want to freeze the current forecast at a point in time (e.g., "Week 4 forecast") so I can compare it against later forecasts and actuals to measure forecast accuracy and hold teams accountable for their calls.
- As **Morgan (Sales Manager)**, I want to compare this week's forecast against last week's to see what changed (deals added, removed, or recategorized) so I can explain forecast movement in the weekly leadership meeting.
- As **Casey (Finance/Controller)**, I want a forecast-vs-actual comparison at quarter end showing how accurate the forecast was so I can improve our financial planning models and report to the CFO on forecast reliability.
- As **Jordan (CRM Admin)**, I want snapshots to be created automatically on a schedule (e.g., every Monday) and also manually on demand so we always have a historical record without relying on someone remembering to click a button.

## Outcomes

1. **Snapshot creation**: Save a point-in-time freeze of the current forecast (pipeline by category, weighted amounts, deal list)
2. **Snapshot storage**: Use the existing `forecast_scenario_snapshots` table (already in schema, currently unused)
3. **Snapshot comparison**: Side-by-side view of two snapshots showing what changed (deals added, removed, category changes, amount changes)
4. **Forecast vs actual**: Compare a historical forecast snapshot against actual closed-won results for the same period
5. **Accuracy tracking**: Forecast accuracy metric over time (how close was the forecast to actual revenue?)
6. **Auto-snapshot**: Option to auto-create snapshots on a schedule (weekly, bi-weekly)
7. **Snapshot browser**: UI to browse, compare, and delete historical snapshots

## Success Metrics

- [ ] Snapshots capture: deal list, forecast categories, amounts, weighted totals, and metadata (who created, when)
- [ ] Snapshot storage uses existing forecast_scenario_snapshots table
- [ ] Manual snapshot creation via button click on forecast page
- [ ] Auto-snapshot on configurable schedule (default: weekly Monday 6am)
- [ ] Comparison view shows two snapshots side-by-side with diff highlighting
- [ ] Comparison identifies: deals added, deals removed, category changes, amount changes
- [ ] Forecast-vs-actual view compares snapshot against actual closed-won for same period
- [ ] Accuracy metric computed: MAPE or similar (forecast amount vs actual amount)
- [ ] Snapshot browser with list, search by date, compare, and delete
- [ ] At least 52 weeks of snapshots retained (configurable retention policy)

## Implementation Plan

1. Create `src/lib/forecast/snapshot-engine.ts`:
   - `createSnapshot(scenario, deals, forecastCategories, metadata)` — capture current state
   - `compareSnapshots(snapshotA, snapshotB)` — diff two snapshots, identifying adds/removes/changes
   - `computeForecastAccuracy(snapshot, actuals)` — compare forecast against actual results
   - `computeAccuracyTrend(snapshots, actuals, periods)` — accuracy over time
   - Snapshot data shape: `{ deals: [{id, name, amount, stage, forecastCategory, owner}], summary: {committed, bestCase, pipeline, total, weighted} }`
2. Create/update API routes:
   - `POST /api/forecast/snapshots` — create a new snapshot
   - `GET /api/forecast/snapshots` — list snapshots with metadata
   - `GET /api/forecast/snapshots/[id]` — get snapshot details
   - `GET /api/forecast/snapshots/compare` — compare two snapshots
   - `GET /api/forecast/snapshots/accuracy` — forecast vs actual comparison
   - `DELETE /api/forecast/snapshots/[id]` — delete a snapshot
3. Create snapshot UI components:
   - `SnapshotBrowser` — list/search/select snapshots
   - `SnapshotComparison` — side-by-side diff view
   - `ForecastAccuracyChart` — accuracy trend over time
   - `CreateSnapshotButton` — manual snapshot creation
4. Integrate into forecast page as a new "Snapshots" tab
5. Wire auto-snapshot into the scheduled sync job (TASK-111) or as a separate scheduled task

## Files to Change

- `src/lib/forecast/snapshot-engine.ts` — NEW: snapshot creation, comparison, and accuracy engine
- `src/lib/forecast/snapshot-engine.test.ts` — NEW: unit tests for snapshot logic
- `src/lib/forecast/snapshot-types.ts` — NEW: TypeScript types for snapshots, comparisons, accuracy
- `src/app/api/forecast/snapshots/route.ts` — NEW: CRUD for snapshots (list, create)
- `src/app/api/forecast/snapshots/[id]/route.ts` — NEW: individual snapshot operations
- `src/app/api/forecast/snapshots/compare/route.ts` — NEW: snapshot comparison endpoint
- `src/app/api/forecast/snapshots/accuracy/route.ts` — NEW: forecast vs actual endpoint
- `src/app/(dashboard)/forecast/page.tsx` — add Snapshots tab with browser and comparison UI
- `src/components/forecast/snapshot-browser.tsx` — NEW: snapshot list/search component
- `src/components/forecast/snapshot-comparison.tsx` — NEW: side-by-side diff view
- `src/components/forecast/forecast-accuracy-chart.tsx` — NEW: accuracy trend chart
- `src/components/forecast/create-snapshot-button.tsx` — NEW: manual snapshot trigger
- `src/lib/db/forecast-schema.ts` — verify forecast_scenario_snapshots table structure matches needs

## Tests to Write

- `src/lib/forecast/snapshot-engine.test.ts`:
  - Snapshot creation: captures all deal data, categories, and summary correctly
  - Snapshot comparison: identifies deals added between snapshots
  - Snapshot comparison: identifies deals removed between snapshots
  - Snapshot comparison: identifies category changes (e.g., pipeline → committed)
  - Snapshot comparison: identifies amount changes with delta
  - Snapshot comparison: handles empty snapshots gracefully
  - Forecast accuracy: computes correct accuracy when forecast matches actual
  - Forecast accuracy: computes correct accuracy with over-forecast
  - Forecast accuracy: computes correct accuracy with under-forecast
  - Accuracy trend: computes accuracy across multiple periods
  - Edge cases: snapshot with zero deals, comparison with identical snapshots

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #4 (Forecast Accountability). Related to TASK-009 (forecast snapshots) in PRJ-001. Uses existing forecast_scenario_snapshots table.

## Takeaways

_To be filled during execution_
