---
title: "Scheduled Auto-Sync (Background Job)"
id: TASK-111
project: PRJ-005
status: backlog
priority: P1
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #integration, #hubspot, #automation, #sync, #background-jobs]
---

# TASK-111: Scheduled Auto-Sync (Background Job)

## User Stories

- As **Dana (VP RevOps)**, I want CRM data to sync automatically on a schedule so my dashboards are always current when I check them in the morning — I should never have to think about clicking "Sync Now."
- As **Morgan (Sales Manager)**, I want to see when data was last synced and know it's running automatically so I can trust the numbers in my pipeline review without wondering if they're stale.
- As **Jordan (CRM Admin)**, I want to configure the sync schedule (hourly, every 6 hours, daily, custom cron) and monitor sync health (last run time, duration, errors) from the settings page so I can tune it to our needs.
- As **Alex (Sales Rep)**, I want to see a "Last synced: X minutes ago" indicator on every dashboard page so I know how fresh the data is when I'm checking my numbers.

## Outcomes

1. **Background sync**: CRM sync runs automatically on a configurable schedule without user intervention
2. **Schedule options**: Hourly, every 6 hours, daily (at configurable time), custom cron expression
3. **Sync health dashboard**: Settings page shows last sync time, next scheduled sync, duration of last sync, error count, sync history (last 10 runs)
4. **Freshness indicator**: Every dashboard page shows "Last synced: X ago" in the header or footer
5. **Manual override**: "Sync Now" button still works and resets the timer
6. **Error handling**: Failed syncs retry with exponential backoff, alert on 3+ consecutive failures
7. **Implementation**: Use lightweight approach (Next.js API route as cron target) — no Redis/BullMQ dependency required

## Success Metrics

- [ ] Sync runs automatically on the configured schedule without user intervention
- [ ] Schedule is configurable from settings page (hourly, 6h, daily, custom cron)
- [ ] Settings page shows: last sync time, next sync, duration, error history
- [ ] Every dashboard page shows "Last synced: X ago" freshness indicator
- [ ] Manual "Sync Now" works alongside scheduled sync
- [ ] Failed syncs retry up to 3 times with exponential backoff
- [ ] 3+ consecutive failures trigger a visible alert on the settings page
- [ ] Sync does not start if another sync is already running (mutex/lock)
- [ ] Sync schedule persists across server restarts (stored in DB, not in-memory)
- [ ] Works without Redis — uses a lightweight scheduling approach

## Implementation Plan

1. Create `src/lib/sync/scheduler.ts`:
   - `SyncScheduler` class: manages sync schedule configuration and execution
   - `getScheduleConfig(orgId)` — read schedule from org settings
   - `updateScheduleConfig(orgId, config)` — update schedule
   - `shouldRunSync(orgId)` — check if sync is due (compare lastRun + interval vs now)
   - `acquireSyncLock(orgId)` — prevent concurrent syncs (DB-based lock)
   - `releaseSyncLock(orgId)` — release lock after sync completes
   - `recordSyncRun(orgId, result)` — store sync history entry
2. Create `src/app/api/sync/cron/route.ts`:
   - GET endpoint designed to be called by external cron (Vercel cron, system crontab, or setInterval)
   - Checks all orgs for due syncs and runs them
   - Returns sync results for monitoring
3. Create `src/app/api/sync/schedule/route.ts`:
   - GET: return current schedule config and sync health
   - PUT: update schedule config
4. Update settings page:
   - Schedule configuration section (interval selector, custom cron input)
   - Sync health display (last run, next run, duration, error history)
   - Alert display for consecutive failures
5. Add freshness indicator to dashboard layout:
   - Read `sync_cursors` for last sync timestamp
   - Display "Last synced: X ago" in page header
   - Color-code: green (<1h), yellow (1-6h), red (>6h)
6. Store schedule config and sync history in org settings or dedicated table

## Files to Change

- `src/lib/sync/scheduler.ts` — NEW: sync scheduling engine with lock management
- `src/lib/sync/scheduler.test.ts` — NEW: unit tests for scheduling logic
- `src/lib/sync/sync-types.ts` — NEW or extend: types for schedule config, sync history, sync health
- `src/app/api/sync/cron/route.ts` — NEW: cron endpoint for external trigger
- `src/app/api/sync/schedule/route.ts` — NEW: schedule configuration CRUD
- `src/app/(dashboard)/settings/page.tsx` — add sync schedule configuration and health monitoring
- `src/app/(dashboard)/layout.tsx` — add "Last synced" freshness indicator to all dashboard pages
- `src/lib/db/schema.ts` — add sync_history table or sync fields to organizations table (if needed)

## Tests to Write

- `src/lib/sync/scheduler.test.ts`:
  - shouldRunSync: returns true when lastRun + interval < now
  - shouldRunSync: returns false when within interval
  - shouldRunSync: returns true when no previous run exists
  - acquireSyncLock: prevents concurrent syncs (returns false if already locked)
  - releaseSyncLock: frees the lock for next run
  - Stale lock detection: auto-releases locks older than 1 hour (handles crashed syncs)
  - Schedule config: correctly parses hourly, 6h, daily, and cron expressions
  - Retry logic: exponential backoff timing is correct (1min, 5min, 15min)
  - Failure tracking: consecutive failure count increments and resets correctly
  - Sync history: records run results with timestamps and durations

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #7 (Automation). Extends TASK-012 from PRJ-001 with health monitoring, failure alerting, and freshness indicators.

## Takeaways

_To be filled during execution_
