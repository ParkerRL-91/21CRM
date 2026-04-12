---
title: "Product catalog schema & API"
id: TASK-049
project: PRJ-003
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #products, #schema, #api]
---

# TASK-049: Product catalog schema & API

## User Stories
- As a Sales Manager, I want to create and manage a product catalog with distinct product types (subscription, one-time, professional service) so that reps can select correct items when building quotes.

## Outcomes
Product table in Drizzle with CRUD API. Products have: name, SKU, description, type (subscription/one_time/service), family, active/inactive status. Subscription products require default_term_months and billing_frequency.

## Success Metrics
- [ ] `products` table created via Drizzle schema
- [ ] `POST /api/products` — create product with validation
- [ ] `GET /api/products` — list with filtering by type, family, status, search
- [ ] `GET /api/products/[id]` — detail
- [ ] `PUT /api/products/[id]` — update (archive, not delete)
- [ ] Only active products appear in quote line item selector
- [ ] Zod validation for all payloads
- [ ] Tests for validation and business logic

## Implementation Plan

### Schema
```typescript
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  description: text('description'),
  productType: varchar('product_type', { length: 30 }).notNull(),
    // subscription, one_time, professional_service
  family: varchar('family', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  defaultSubscriptionTermMonths: integer('default_subscription_term_months'),
  billingFrequency: varchar('billing_frequency', { length: 20 }),
  chargeType: varchar('charge_type', { length: 20 }).notNull().default('recurring'),
  defaultPrice: numeric('default_price', { precision: 12, scale: 2 }),
  hubspotProductId: varchar('hubspot_product_id', { length: 50 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

## Files to Change
- `src/lib/db/cpq-schema.ts` — NEW: Product, price book, discount tables
- `src/app/api/products/route.ts` — NEW: GET list, POST create
- `src/app/api/products/[id]/route.ts` — NEW: GET detail, PUT update
- `src/lib/cpq/product-validation.ts` — NEW: Zod schemas
- `src/lib/cpq/product-validation.test.ts` — NEW: Tests
