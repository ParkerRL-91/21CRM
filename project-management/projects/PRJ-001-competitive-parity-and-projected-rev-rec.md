---
title: "Competitive Parity & Projected Rev-Rec"
id: PRJ-001
status: active
created: 2026-03-22
updated: 2026-03-22
tags: [#project, #rev-rec, #pipeline, #ux]
---

# PRJ-001: Competitive Parity & Projected Rev-Rec

## Objective

Close the top feature gaps identified from Clari, HubiFi, and Kluster competitive analysis. Build the projected rev-rec feature that no competitor offers — showing recognized revenue for both closed deals and weighted pipeline deals with a toggle between views.

## Success Metrics

- [ ] Rev-rec page shows both closed and projected (closed + weighted) schedules with a view toggle
- [ ] Stat cards across pipeline and dashboard pages are clickable → drill to underlying deals
- [ ] Pipeline page shows deal risk flags (stale, slipped) and weekly movement summary
- [ ] Dashboard home shows quarter progression chart (closed-won vs quota vs forecast)
- [ ] Rev-rec monthly view displays a proper waterfall (opening → bookings → recognition → closing)
- [ ] Dashboard surfaces a change/activity newsfeed on first load
- [ ] All new features have passing tests and zero type errors

## Tasks

| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-001 | Projected rev-rec (closed + weighted pipeline toggle) | ready | P0 |
| TASK-002 | Deferred revenue waterfall view | ready | P1 |
| TASK-003 | Clickable stat cards with drill-down | ready | P1 |
| TASK-004 | Deal risk flags (stale, slipped close date) | ready | P1 |
| TASK-005 | Pipeline movement view (weekly adds/losses/changes) | ready | P1 |
| TASK-006 | Quarter progression chart | ready | P1 |
| TASK-007 | Change newsfeed / activity summary on dashboard home | ready | P1 |

## Dependencies

```
TASK-001 (projected rev-rec) → TASK-002 (waterfall) depends on projected data
TASK-003 (drill-down) → independent, can parallel with anything
TASK-004 (risk flags) → independent
TASK-005 (pipeline movement) → independent
TASK-006 (quarter chart) → independent
TASK-007 (newsfeed) → benefits from TASK-004 and TASK-005 data
```

## Recommended Execution Order

1. **TASK-001** — Projected rev-rec (foundational, unlocks TASK-002)
2. **TASK-002** — Waterfall view (enhances rev-rec with projected data)
3. **TASK-003 + TASK-004 + TASK-005** — Parallel (independent features)
4. **TASK-006** — Quarter progression (builds on pipeline data)
5. **TASK-007** — Newsfeed (benefits from risk flags and movement data)

## Decisions Log

- 2026-03-22: Projected rev-rec uses weighted pipeline deals (amount × stage probability). Deals with no probability default to 0% and are excluded. Toggle between "Closed Only" and "Closed + Projected" views.
- 2026-03-22: Feature gap prioritization based on synthesis of Clari, HubiFi, and Kluster analysis. See `knowledge/competitive-intel/feature-gaps.md`.
