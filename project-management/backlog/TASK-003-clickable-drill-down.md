---
title: "Clickable Stat Cards with Drill-Down"
id: TASK-003
project: PRJ-001
status: ready
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #ux, #pipeline, #dashboard]
---

# TASK-003: Clickable Stat Cards with Drill-Down

## User Stories

- As a revenue leader, I want to click on any metric card (total pipeline, closed-won, avg deal size) and see the underlying deals so I can investigate without switching pages.
- As an ops user, I want drill-down to filter the current page's data table to show only the deals that make up that number.

## Outcomes

1. Stat cards across pipeline, dashboard, team, and rev-rec pages are clickable
2. Clicking a stat card filters the page's data table/list to show the underlying records
3. An active filter is visually indicated (highlighted card, "showing X of Y" text)
4. Clicking again (or clicking a "clear" button) removes the filter

## Success Metrics

- [ ] At least pipeline and dashboard pages have interactive stat cards
- [ ] Clicking a card visually highlights it and filters the data below
- [ ] Filter can be cleared to return to full view
- [ ] No page reload required — client-side filter only

## Implementation Plan

1. Create a reusable `InteractiveStatCard` component that accepts an `onClick` handler and `active` state
2. Update pipeline page to use it — clicking "Closed Won" card filters deals to closed-won, etc.
3. Update dashboard page similarly
4. Use React state for the active filter — no API changes needed since data is already loaded

## Files to Change

- `src/components/charts/metric-card.tsx` — make clickable with active state
- `src/app/(dashboard)/pipeline/page.tsx` — wire stat cards to filter state
- `src/app/(dashboard)/dashboards/page.tsx` — wire stat cards to filter state
- `src/app/(dashboard)/rev-rec/page.tsx` — wire stat cards to filter schedules

## Status Log

- 2026-03-22: Created as part of PRJ-001

## Takeaways

_To be filled during execution_
