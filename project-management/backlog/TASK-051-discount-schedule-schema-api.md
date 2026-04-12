---
title: "Discount schedule schema & API (tiered/volume/term)"
id: TASK-051
project: PRJ-003
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #pricing, #discounts, #schema]
---

# TASK-051: Discount schedule schema & API

## User Stories
- As a Sales Manager, I want to define tiered pricing structures for products (e.g., 1-500 = $X, 501-2000 = $Y) so pricing scales with customer size.

## Outcomes
Discount schedule and discount tier tables. Supports three types: tiered (slab), volume (all-units), and term-based. Each schedule has ordered tiers with bounds and values. Linkable to products or product families.

## Success Metrics
- [ ] `discount_schedules` and `discount_tiers` tables created
- [ ] CRUD API for schedules and tiers
- [ ] Supports type: tiered (slab), volume (all-units), term
- [ ] Tiers have lower_bound, upper_bound, discount_value, sort_order
- [ ] Schedules linkable to products or product families
- [ ] Changing tier definitions does NOT retroactively affect existing quotes
- [ ] Tests for tier ordering and validation

## Implementation Plan

### Schema
```typescript
export const discountSchedules = pgTable('discount_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // tiered, volume, term
  discountUnit: varchar('discount_unit', { length: 20 }).notNull().default('percent'),
    // percent, amount, price
  productId: uuid('product_id').references(() => products.id),
  productFamily: varchar('product_family', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const discountTiers = pgTable('discount_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id').notNull().references(() => discountSchedules.id, { onDelete: 'cascade' }),
  lowerBound: numeric('lower_bound', { precision: 12, scale: 2 }).notNull(),
  upperBound: numeric('upper_bound', { precision: 12, scale: 2 }),
  discountValue: numeric('discount_value', { precision: 12, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

## Files to Change
- `src/lib/db/cpq-schema.ts` — MODIFY: Add discount tables
- `src/app/api/discount-schedules/route.ts` — NEW
- `src/app/api/discount-schedules/[id]/tiers/route.ts` — NEW
- `src/lib/cpq/discount-validation.ts` — NEW
- `src/lib/cpq/discount-validation.test.ts` — NEW
