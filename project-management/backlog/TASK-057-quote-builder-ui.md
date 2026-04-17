---
title: "Quote builder UI"
id: TASK-057
project: PRJ-003
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #quotes, #ui]
---

# TASK-057: Quote builder UI

## User Stories
- As a Sales Rep, I want to add products as line items to a quote, seeing real-time price calculations, so I can build accurate proposals.
- As a Sales Rep, I want to group line items into sections so the quote is organized.

## Outcomes
Full quote builder page at `/quotes/[id]/edit` with product selector, line item table with real-time totals, group management, and drag-and-drop reordering.

## Success Metrics
- [ ] Quote builder page with header info and line items table
- [ ] Product search/selector showing active products from selected price book
- [ ] Line items table: product, qty, list price, discount, net price, total
- [ ] Real-time total recalculation on quantity/discount change
- [ ] Line item groups (sections) with subtotals
- [ ] Drag-and-drop line item reordering
- [ ] Quote summary: subtotal, discount total, tax, grand total
- [ ] Save draft, Submit for approval buttons
- [ ] Read-only mode for non-draft quotes
- [ ] Loading, error, empty states

## Files to Change
- `src/app/(dashboard)/quotes/[id]/edit/page.tsx` — NEW
- `src/components/cpq/quote-builder.tsx` — NEW
- `src/components/cpq/line-item-table.tsx` — NEW
- `src/components/cpq/product-selector.tsx` — NEW
- `src/components/cpq/quote-summary.tsx` — NEW
- `src/hooks/use-quote-builder.ts` — NEW
