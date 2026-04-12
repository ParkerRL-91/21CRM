---
title: "Quote CRUD API with line item management"
id: TASK-056
project: PRJ-003
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #quotes, #api]
---

# TASK-056: Quote CRUD API with line item management

## User Stories
- As a Sales Rep, I want to create, edit, and manage quotes with line items so I can build proposals for customers.

## Outcomes
Complete REST API for quote lifecycle: create quote from opportunity, add/remove/reorder line items, auto-calculate totals, manage quote status transitions.

## Success Metrics
- [ ] `POST /api/quotes` — create quote with auto-generated number
- [ ] `GET /api/quotes` — list with filtering by status, account, type, rep
- [ ] `GET /api/quotes/[id]` — detail with line items, groups, snapshots
- [ ] `PUT /api/quotes/[id]` — update fields with status transition validation
- [ ] `POST /api/quotes/[id]/line-items` — add line item (snapshots price from price book)
- [ ] `PUT /api/quotes/[id]/line-items/[lineId]` — modify line item
- [ ] `DELETE /api/quotes/[id]/line-items/[lineId]` — remove line item
- [ ] `PUT /api/quotes/[id]/line-items/reorder` — reorder line items
- [ ] Totals auto-recalculated on every line item change
- [ ] Price snapshotted from price book entry at line creation (never re-fetched)
- [ ] Quote becomes read-only when not in draft status
- [ ] Tests for status transitions and total calculations

## Files to Change
- `src/app/api/quotes/route.ts` — NEW
- `src/app/api/quotes/[id]/route.ts` — NEW
- `src/app/api/quotes/[id]/line-items/route.ts` — NEW
- `src/lib/cpq/quote-service.ts` — NEW
- `src/lib/cpq/quote-totals.ts` — NEW: Total calculation logic
- `src/lib/cpq/quote-totals.test.ts` — NEW
