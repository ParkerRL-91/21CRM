---
title: "Fix Industry Dropdown: Show Display Names Instead of API Names"
id: TASK-022
project: PRJ-001
status: ready
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #subscriptions, #bug, #ux]
---

# TASK-022: Fix Industry Dropdown Display Names

## User Stories

- As a user, I want the industry filter on the subscriptions page to show human-readable names (e.g., "Information Technology") instead of API internal names (e.g., "INFORMATION_TECHNOLOGY_AND_SERVICES") so I can find what I'm looking for.

## Outcomes

1. Industry dropdown shows display-friendly labels
2. Labels resolved from HubSpot property options (the `industry` property has options with `label` and `value` — we should show `label`, not `value`)

## Success Metrics

- [ ] Industry dropdown shows labels like "Information Technology" not "INFORMATION_TECHNOLOGY_AND_SERVICES"
- [ ] Filter still works correctly (sends the internal value to the API)
- [ ] Works for all industries, not just a hardcoded subset

## Implementation Plan

1. Fetch HubSpot property options for the `industry` field (from schema API or `app_config`)
2. Build a lookup map: internal value → display label
3. Use the display label in the dropdown, send the internal value when filtering
4. Option A: Fetch property schema at page load
5. Option B: Sync property options during `syncAll()` and store in `app_config` (like we do for pipelines/owners)

## Files to Change

- `src/app/(dashboard)/subscriptions/page.tsx` — fix dropdown to use display labels
- Possibly `src/lib/sync/engine.ts` — add property options sync (if not using on-demand fetch)
- Possibly `src/app/api/schema/route.ts` — add industry options if not already there

## Status Log

- 2026-03-22: Created. Industry filter shows raw API values instead of human-readable labels.

## Takeaways

_To be filled during execution_
