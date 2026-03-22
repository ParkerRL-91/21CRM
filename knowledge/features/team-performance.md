---
title: Team Performance
tags: [#feature, #team]
created: 2026-03-22
updated: 2026-03-22
---

# Team Performance

## Current State

The team page groups deals by `hubspot_owner_id` and shows:
- Pipeline value by rep (bar chart)
- Rep performance table (pipeline value, deal count, avg deal size)

## Owner Resolution

Rep names are resolved from the `app_config["hubspot_owners"]` cache:
1. `syncOwners()` runs during `syncAll()` → stores `{ owners: [{ id, email, firstName, lastName }] }`
2. Team page fetches `GET /api/crm/owners` → builds `Map<id, name>`
3. Owner IDs in bar chart and table are replaced with display names

## Fallback

If owners haven't been synced yet, raw HubSpot IDs are shown. The page handles this gracefully.

See [[hubspot-sync-engine]] for when owners are synced.
