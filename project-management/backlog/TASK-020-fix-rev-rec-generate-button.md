---
title: "Fix Rev-Rec Generate Button (Lost During Repo Migration)"
id: TASK-020
project: PRJ-001
status: done
priority: P0
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #rev-rec, #bug]
---

# TASK-020: Fix Rev-Rec Generate Button

## User Stories

- As a user, I want the "Generate Schedules" button on the rev-rec page to work so I can compute recognition schedules from my closed-won deals.

## Outcomes

1. Rev-rec page loads with the generate button, schedules API, and generate API all functional
2. Clicking "Generate Schedules" creates rev-rec schedules and displays them
3. All rev-rec code changes from the previous session are present in the repo

## Success Metrics

- [ ] Rev-rec page renders without errors
- [ ] Generate button creates schedules in the database
- [ ] Schedules display in the monthly waterfall and deal-level table
- [ ] `rev_rec_schedules` table exists and is accessible

## Implementation Plan

1. Verify the rev-rec page code (`src/app/(dashboard)/rev-rec/page.tsx`) is the updated version with generate button
2. Verify API routes exist: `/api/rev-rec/generate`, `/api/rev-rec/schedules`
3. Verify rev-rec schema is exported from `schema.ts`
4. Verify `drizzle-kit push` has been run to create the table
5. Fix any missing files or broken references

## Files to Change

- `src/app/(dashboard)/rev-rec/page.tsx` — verify/restore generate button version
- `src/app/api/rev-rec/generate/route.ts` — verify exists
- `src/app/api/rev-rec/schedules/route.ts` — verify exists
- `src/lib/db/schema.ts` — verify rev-rec export
- `src/lib/db/rev-rec-schema.ts` — verify unique index

## Status Log

- 2026-03-22: Created. Code was written in RevOps OS but may not have carried over to RevOps-OS-2 cleanly.

## Takeaways

_To be filled during execution_
