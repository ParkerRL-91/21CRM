# TASK-114 — Auto-Sync Engine
**Status:** Complete
**Phase:** PRJ-005
**Completed:** 2026-04-19

## Description
Implemented the auto-sync engine that runs on a configurable schedule (default: every 15 minutes) to reconcile CPQ data against connected CRM providers. Handles incremental syncs, full resyncs, and error backoff.

## Key Files
- packages/twenty-server/src/modules/cpq/services/pipeline/auto-sync.ts
