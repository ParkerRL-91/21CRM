---
title: "Product bundle support"
id: TASK-054
project: PRJ-003
status: ready
priority: P2
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #products, #bundles]
---

# TASK-054: Product bundle support

## User Stories
- As a Finance user, I want to configure product bundles (e.g., "Enterprise Package" = Platform + Analytics + API + Implementation) so common configurations can be quoted quickly.

## Outcomes
Bundle product type that contains child product options with required/optional flags, min/max quantities. Adding a bundle to a quote auto-adds required children as indented sub-lines.

## Success Metrics
- [ ] `product_options` table for bundle composition
- [ ] Bundle product type in product catalog
- [ ] Required vs optional child products with min/max quantity
- [ ] Adding bundle to quote auto-adds required children
- [ ] Optional children toggleable by rep
- [ ] Bundle-level discounts cascade to children
- [ ] Tests for bundle expansion logic

## Files to Change
- `src/lib/db/cpq-schema.ts` — MODIFY: Add product_options table
- `src/lib/cpq/bundle-expander.ts` — NEW: Bundle expansion logic
- `src/lib/cpq/bundle-expander.test.ts` — NEW
