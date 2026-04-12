---
title: "Quote & quote line item schema"
id: TASK-055
project: PRJ-003
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #quotes, #schema]
---

# TASK-055: Quote & quote line item schema

## User Stories
- As a Sales Rep, I want to create quotes associated with opportunities/accounts so I can build proposals.

## Outcomes
Quote, quote_line_items, and quote_line_groups tables. Quote tracks: status (draft→in_review→approved→presented→accepted→rejected→expired), type (new/amendment/renewal), versioning, financial totals. Line items track the full price waterfall per product.

## Success Metrics
- [ ] `quotes` table with status machine, type field, version tracking
- [ ] `quote_line_items` table with price waterfall fields (list→special→prorated→discount→net)
- [ ] `quote_line_groups` table for section grouping
- [ ] `quote_snapshots` table for immutable version history
- [ ] `quote_audit_log` table for change tracking
- [ ] All monetary columns NUMERIC(12,2)
- [ ] Self-referential parent_line_id for bundle hierarchy
- [ ] Gap numbering (10,20,30) for sort_order
- [ ] Type definitions exported
- [ ] Migration generated

## Implementation Plan

### Core tables
```typescript
export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  quoteNumber: varchar('quote_number', { length: 50 }).notNull(),
  opportunityHubspotId: varchar('opportunity_hubspot_id', { length: 50 }),
  accountHubspotId: varchar('account_hubspot_id', { length: 50 }),
  accountName: varchar('account_name', { length: 255 }),
  status: varchar('status', { length: 30 }).notNull().default('draft'),
  type: varchar('type', { length: 20 }).notNull().default('new'),
    // new, amendment, renewal
  versionNumber: integer('version_number').notNull().default(1),
  isPrimary: boolean('is_primary').notNull().default(false),
  priceBookId: uuid('price_book_id').references(() => priceBooks.id),
  contractId: uuid('contract_id').references(() => contracts.id),
  subscriptionTermMonths: integer('subscription_term_months').notNull().default(12),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  expirationDate: date('expiration_date').notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('CAD'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  discountTotal: numeric('discount_total', { precision: 12, scale: 2 }).notNull().default('0'),
  taxTotal: numeric('tax_total', { precision: 12, scale: 2 }).notNull().default('0'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull().default('0'),
  paymentTerms: varchar('payment_terms', { length: 30 }).default('net_30'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  metadata: jsonb('metadata').default({}),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quoteLineItems = pgTable('quote_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteId: uuid('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  priceBookEntryId: uuid('price_book_entry_id').references(() => priceBookEntries.id),
  groupId: uuid('group_id').references(() => quoteLineGroups.id),
  parentLineId: uuid('parent_line_id'), // self-ref for bundles
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull().default('1'),
  // Price waterfall
  listPrice: numeric('list_price', { precision: 12, scale: 2 }).notNull(),
  specialPrice: numeric('special_price', { precision: 12, scale: 2 }),
  proratedPrice: numeric('prorated_price', { precision: 12, scale: 2 }),
  regularPrice: numeric('regular_price', { precision: 12, scale: 2 }),
  customerPrice: numeric('customer_price', { precision: 12, scale: 2 }),
  netUnitPrice: numeric('net_unit_price', { precision: 12, scale: 2 }).notNull(),
  netTotal: numeric('net_total', { precision: 12, scale: 2 }).notNull(),
  // Discount fields
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }),
  // Subscription
  billingType: varchar('billing_type', { length: 20 }).notNull().default('recurring'),
  billingFrequency: varchar('billing_frequency', { length: 20 }),
  subscriptionTermMonths: integer('subscription_term_months'),
  // Audit
  pricingAudit: jsonb('pricing_audit').default([]),
  sortOrder: integer('sort_order').notNull().default(10),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

## Files to Change
- `src/lib/db/cpq-schema.ts` — MODIFY: Add quote tables
- `src/lib/cpq/quote-validation.ts` — NEW
- `src/lib/cpq/quote-validation.test.ts` — NEW
