---
title: "Price book schema & API"
id: TASK-050
project: PRJ-003
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #pricing, #schema, #api]
---

# TASK-050: Price book schema & API

## User Stories
- As a Sales Manager, I want to maintain multiple price books (Standard, Partner, Academic) so that different customer segments receive appropriate pricing.

## Outcomes
Price book and price book entry tables with CRUD API. Each entry links a product to a unit price and currency within a price book. One price book designated as Standard (default).

## Success Metrics
- [ ] `price_books` and `price_book_entries` tables created
- [ ] CRUD API for price books and entries
- [ ] One price book designated as default (Standard)
- [ ] Product can have different prices in different price books
- [ ] Entries can be activated/deactivated without deleting historical data
- [ ] When quote created, price book selected at quote level
- [ ] Tests for validation

## Implementation Plan

### Schema
```typescript
export const priceBooks = pgTable('price_books', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isStandard: boolean('is_standard').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('CAD'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const priceBookEntries = pgTable('price_book_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  priceBookId: uuid('price_book_id').notNull().references(() => priceBooks.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('CAD'),
  isActive: boolean('is_active').notNull().default(true),
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('pbe_pricebook_product_unique').on(table.priceBookId, table.productId),
]);
```

## Files to Change
- `src/lib/db/cpq-schema.ts` — MODIFY: Add price book tables
- `src/app/api/price-books/route.ts` — NEW
- `src/app/api/price-books/[id]/entries/route.ts` — NEW
- `src/lib/cpq/price-book-validation.ts` — NEW
- `src/lib/cpq/price-book-validation.test.ts` — NEW
