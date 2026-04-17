---
title: "Pivot Table UI for Rev-Rec Exploration"
id: TASK-019
project: PRJ-001
status: done
priority: P3
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #rev-rec, #ux]
---

# TASK-019: Rev-Rec Pivot Table

## User Stories

- As a finance analyst, I want to slice rev-rec data by product, customer, rep, and time period so I can answer questions like "how much revenue is from Product X this quarter?" or "which rep's deals have the most deferred revenue?"
- As a CFO, I want to pivot between different groupings without asking someone to build a custom report each time.

## Outcomes

1. Rev-rec page has a "Explore" tab with a pivot table interface
2. User selects:
   - **Rows**: group by deal, product (line item name), owner, company
   - **Columns**: time periods (month, quarter)
   - **Values**: recognized, deferred, total booked
3. Table updates dynamically based on selected dimensions
4. Totals row and column auto-computed

## Success Metrics

- [ ] At least 3 row grouping options (deal, product, owner)
- [ ] Monthly or quarterly column options
- [ ] Values show recognized vs deferred breakdown
- [ ] Handles 500+ schedules without performance issues
- [ ] Export to CSV from the pivot view

## Implementation Plan

1. Build a `PivotTable` component that takes data + dimension config
2. Rev-rec schedules data already has deal_name, line_item_name, owner, monthly allocations
3. Client-side grouping and aggregation (data is already loaded from `/api/rev-rec/schedules`)
4. Add dimension selector dropdowns above the table
5. Add CSV export button

## Files to Change

- `src/components/charts/pivot-table.tsx` — NEW: pivot table component
- `src/app/(dashboard)/rev-rec/page.tsx` — add "Explore" tab with pivot table

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-19 (HubiFi data exploration pattern).

## Takeaways

_To be filled during execution_
