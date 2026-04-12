---
title: "Price book management UI"
id: TASK-053
project: PRJ-003
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #pricing, #ui]
---

# TASK-053: Price book management UI

## User Stories
- As a Sales Manager, I want to manage price books and their entries so I can set different pricing for different customer segments.

## Outcomes
Price book management at `/settings/price-books` with list of books, entry management per book, and bulk price updates.

## Success Metrics
- [ ] Price books list page at `/settings/price-books`
- [ ] Price book detail showing all product entries with prices
- [ ] Add/edit/deactivate price book entries
- [ ] Visual indicator for Standard (default) price book
- [ ] Bulk price update capability (percentage or fixed amount)

## Files to Change
- `src/app/(dashboard)/settings/price-books/page.tsx` — NEW
- `src/app/(dashboard)/settings/price-books/[id]/page.tsx` — NEW
- `src/components/cpq/price-book-entries-table.tsx` — NEW
