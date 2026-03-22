---
title: "Team Page: Show Rep Names Instead of User IDs"
id: TASK-021
project: PRJ-001
status: ready
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #team, #hubspot, #bug]
---

# TASK-021: Team Page Rep Names

## User Stories

- As a sales manager, I want to see rep names (e.g., "John Smith") in charts and tables instead of raw HubSpot owner IDs (e.g., "123456789") so the team page is actually usable.

## Outcomes

1. Team page bar chart shows rep names, not IDs
2. Team page data table shows rep names, not IDs
3. Owner lookup is synced from HubSpot during `syncAll()`
4. Fallback to ID if owner name not yet synced

## Success Metrics

- [ ] `syncOwners()` runs during sync and stores owner data in `app_config`
- [ ] `/api/crm/owners` endpoint returns owner name lookup
- [ ] Team page resolves IDs to names in both chart and table
- [ ] Works even if owners haven't been synced yet (shows ID as fallback)

## Implementation Plan

1. Verify `syncOwners()` exists in sync engine and runs during `syncAll()`
2. Verify `/api/crm/owners` route exists
3. Verify team page fetches owner map and resolves names
4. If any of these are missing from the repo, restore them

## Files to Change

- `src/lib/sync/engine.ts` — verify `syncOwners()` present
- `src/app/api/crm/owners/route.ts` — verify exists
- `src/app/(dashboard)/team/page.tsx` — verify owner resolution code

## Status Log

- 2026-03-22: Created. Code was written in RevOps OS session but needs verification in RevOps-OS-2.

## Takeaways

_To be filled during execution_
