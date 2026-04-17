---
title: "Product catalog management UI"
id: TASK-052
project: PRJ-003
status: done
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #products, #ui]
---

# TASK-052: Product catalog management UI

## User Stories
- As a Sales Manager, I want a product catalog page to create, edit, and manage products so I can maintain the catalog without developer help.

## Outcomes
Product management page at `/settings/products` with table view, create/edit forms, and search/filter. Shows product name, SKU, type, family, default price, active status.

## Success Metrics
- [ ] Products page at `/settings/products`
- [ ] Table with columns: name, SKU, type badge, family, default price, status toggle
- [ ] Create product form with all required fields
- [ ] Edit product inline or via modal
- [ ] Archive (soft-delete) instead of hard delete
- [ ] Filter by type, family, status; search by name/SKU
- [ ] Loading, error, empty states

## Files to Change
- `src/app/(dashboard)/settings/products/page.tsx` — NEW
- `src/components/cpq/product-form.tsx` — NEW
- `src/components/cpq/product-table.tsx` — NEW
