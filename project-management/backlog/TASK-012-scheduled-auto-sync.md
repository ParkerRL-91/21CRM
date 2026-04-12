---
title: "Scheduled Auto-Sync (Daily Background Sync)"
id: TASK-012
project: PRJ-001
status: done
priority: P2
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #integration, #hubspot]
---

# TASK-012: Scheduled Auto-Sync

## User Stories

- As a user, I want my CRM data to sync automatically every day so I never have to click "Sync Now" and wonder if my dashboards are stale.
- As an admin, I want to configure the sync schedule (hourly, daily, custom cron) and see when the next sync will run.

## Outcomes

1. Background sync runs on a configurable schedule (default: daily at 6am)
2. Settings page shows: last sync time, next scheduled sync, and schedule configuration
3. Manual "Sync Now" still works and resets the timer
4. All pages show a "Last synced: X hours ago" timestamp in the header or footer
5. Uses existing BullMQ worker scaffolding if Redis is available, or a lightweight cron alternative

## Success Metrics

- [ ] Sync runs automatically without user intervention
- [ ] Schedule is configurable from settings page
- [ ] Last-synced timestamp visible on all dashboard pages
- [ ] Manual sync still works alongside scheduled sync
- [ ] Handles failures gracefully (retries, error display)

## Implementation Plan

1. Option A (Redis/BullMQ): Wire the existing `src/lib/sync/worker.ts` with a repeatable job
2. Option B (Lightweight): Use a Next.js cron-style API route triggered by an external scheduler (Vercel cron, system cron, or a setInterval in a long-running process)
3. Add schedule configuration to `organizations.syncConfig`
4. Add last-synced timestamp to the layout header (read from `sync_cursors`)
5. Update settings page with schedule controls

## Files to Change

- `src/lib/sync/worker.ts` — add scheduled/repeatable job support
- `src/app/api/sync/schedule/route.ts` — NEW: get/set sync schedule
- `src/app/(dashboard)/settings/page.tsx` — add schedule configuration UI
- `src/app/(dashboard)/layout.tsx` — add last-synced timestamp display
- `src/app/api/sync/cron/route.ts` — NEW: cron endpoint for external triggers

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-12 (Clari pattern).

## Takeaways

_To be filled during execution_
