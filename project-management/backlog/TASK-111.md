# TASK-111 — Forecast Snapshot Engine (forecast-snapshot.ts)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Implement the `forecast-snapshot.ts` engine that captures point-in-time forecast state and enables week-over-week comparison to detect pipeline changes, slippage, and upside.

## Acceptance Criteria
- `captureSnapshot(pipeline, forecastDate): ForecastSnapshot` serializes current forecast state
- `diffSnapshots(previous, current): SnapshotDiff` returns: new deals, lost deals, moved deals, value changes
- Snapshots stored in workspace metadata for persistence
- Diff highlights deals that slipped out of period vs. pulled forward
- Unit tested with snapshot before/after simulated pipeline changes

## Implementation Notes
- File: `packages/twenty-front/src/modules/cpq/engines/forecast-snapshot.ts`
- Snapshots persisted via GraphQL mutation to `cpq_forecast_snapshot` custom object
- Weekly snapshot capture triggered by cron job in NestJS worker
