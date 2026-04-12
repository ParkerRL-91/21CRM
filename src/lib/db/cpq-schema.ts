import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
  unique,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// PRODUCTS
// ============================================================================

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }),
    description: text('description'),
    productType: varchar('product_type', { length: 30 }).notNull(),
    family: varchar('family', { length: 100 }),
    isActive: boolean('is_active').notNull().default(true),
    defaultSubscriptionTermMonths: integer('default_subscription_term_months'),
    billingFrequency: varchar('billing_frequency', { length: 20 }),
    chargeType: varchar('charge_type', { length: 20 })
      .notNull()
      .default('recurring'),
    defaultPrice: numeric('default_price', { precision: 12, scale: 2 }),
    hubspotProductId: varchar('hubspot_product_id', { length: 50 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'products_type_check',
      sql`${table.productType} IN ('subscription', 'one_time', 'professional_service')`
    ),
    check(
      'products_charge_type_check',
      sql`${table.chargeType} IN ('recurring', 'one_time', 'usage')`
    ),
    check(
      'products_billing_check',
      sql`${table.billingFrequency} IS NULL OR ${table.billingFrequency} IN ('monthly', 'quarterly', 'semi_annual', 'annual')`
    ),
    index('products_org_active_idx').on(table.orgId, table.isActive),
    index('products_org_type_idx').on(table.orgId, table.productType),
    index('products_org_family_idx').on(table.orgId, table.family),
    index('products_hubspot_idx').on(table.orgId, table.hubspotProductId),
  ]
);

// ============================================================================
// PRICE BOOKS
// ============================================================================

export const priceBooks = pgTable(
  'price_books',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    isStandard: boolean('is_standard').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    currencyCode: varchar('currency_code', { length: 3 })
      .notNull()
      .default('CAD'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('price_books_org_active_idx').on(table.orgId, table.isActive),
  ]
);

// ============================================================================
// PRICE BOOK ENTRIES
// ============================================================================

export const priceBookEntries = pgTable(
  'price_book_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    priceBookId: uuid('price_book_id')
      .notNull()
      .references(() => priceBooks.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 })
      .notNull()
      .default('CAD'),
    isActive: boolean('is_active').notNull().default(true),
    effectiveDate: date('effective_date'),
    expirationDate: date('expiration_date'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('pbe_pricebook_product_unique').on(
      table.priceBookId,
      table.productId
    ),
    index('pbe_product_idx').on(table.productId),
    index('pbe_pricebook_active_idx').on(table.priceBookId, table.isActive),
  ]
);

// ============================================================================
// DISCOUNT SCHEDULES
// ============================================================================

export const discountSchedules = pgTable(
  'discount_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(),
    discountUnit: varchar('discount_unit', { length: 20 })
      .notNull()
      .default('percent'),
    productId: uuid('product_id').references(() => products.id),
    productFamily: varchar('product_family', { length: 100 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'ds_type_check',
      sql`${table.type} IN ('tiered', 'volume', 'term')`
    ),
    check(
      'ds_unit_check',
      sql`${table.discountUnit} IN ('percent', 'amount', 'price')`
    ),
    index('ds_org_active_idx').on(table.orgId, table.isActive),
    index('ds_product_idx').on(table.productId),
  ]
);

// ============================================================================
// DISCOUNT TIERS
// ============================================================================

export const discountTiers = pgTable(
  'discount_tiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => discountSchedules.id, { onDelete: 'cascade' }),
    lowerBound: numeric('lower_bound', { precision: 12, scale: 2 }).notNull(),
    upperBound: numeric('upper_bound', { precision: 12, scale: 2 }),
    discountValue: numeric('discount_value', { precision: 12, scale: 2 }).notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('dt_schedule_order_idx').on(table.scheduleId, table.sortOrder),
  ]
);

// ============================================================================
// QUOTES
// ============================================================================

export const quotes = pgTable(
  'quotes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),
    quoteNumber: varchar('quote_number', { length: 50 }).notNull(),
    opportunityHubspotId: varchar('opportunity_hubspot_id', { length: 50 }),
    accountHubspotId: varchar('account_hubspot_id', { length: 50 }),
    accountName: varchar('account_name', { length: 255 }),
    status: varchar('status', { length: 30 }).notNull().default('draft'),
    type: varchar('type', { length: 20 }).notNull().default('new'),
    versionNumber: integer('version_number').notNull().default(1),
    isPrimary: boolean('is_primary').notNull().default(false),
    priceBookId: uuid('price_book_id').references(() => priceBooks.id),
    contractId: uuid('contract_id'),
    subscriptionTermMonths: integer('subscription_term_months')
      .notNull()
      .default(12),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    expirationDate: date('expiration_date').notNull(),
    currencyCode: varchar('currency_code', { length: 3 })
      .notNull()
      .default('CAD'),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    discountTotal: numeric('discount_total', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    taxTotal: numeric('tax_total', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    grandTotal: numeric('grand_total', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    paymentTerms: varchar('payment_terms', { length: 30 }).default('net_30'),
    // Acceptance/rejection
    acceptanceMethod: varchar('acceptance_method', { length: 30 }),
    acceptanceDate: date('acceptance_date'),
    poNumber: varchar('po_number', { length: 100 }),
    rejectionReason: varchar('rejection_reason', { length: 50 }),
    rejectionNotes: text('rejection_notes'),
    // Notes
    notes: text('notes'),
    internalNotes: text('internal_notes'),
    metadata: jsonb('metadata').default({}),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('quotes_org_number_unique').on(table.orgId, table.quoteNumber),
    check(
      'quotes_status_check',
      sql`${table.status} IN ('draft', 'in_review', 'approved', 'denied', 'presented', 'accepted', 'rejected', 'expired', 'contracted')`
    ),
    check(
      'quotes_type_check',
      sql`${table.type} IN ('new', 'amendment', 'renewal')`
    ),
    index('quotes_org_status_idx').on(table.orgId, table.status),
    index('quotes_org_account_idx').on(table.orgId, table.accountHubspotId),
    index('quotes_org_type_idx').on(table.orgId, table.type),
    index('quotes_expiration_idx').on(table.orgId, table.expirationDate),
    index('quotes_opportunity_idx').on(table.opportunityHubspotId),
  ]
);

// ============================================================================
// QUOTE LINE GROUPS
// ============================================================================

export const quoteLineGroups = pgTable(
  'quote_line_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quoteId: uuid('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(10),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('qlg_quote_idx').on(table.quoteId, table.sortOrder),
  ]
);

// ============================================================================
// QUOTE LINE ITEMS
// ============================================================================

export const quoteLineItems = pgTable(
  'quote_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quoteId: uuid('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id),
    priceBookEntryId: uuid('price_book_entry_id').references(
      () => priceBookEntries.id
    ),
    groupId: uuid('group_id').references(() => quoteLineGroups.id),
    parentLineId: uuid('parent_line_id'), // self-ref for bundles
    productName: varchar('product_name', { length: 255 }).notNull(),
    productSku: varchar('product_sku', { length: 100 }),
    quantity: numeric('quantity', { precision: 12, scale: 2 })
      .notNull()
      .default('1'),
    // Price waterfall fields
    listPrice: numeric('list_price', { precision: 12, scale: 2 }).notNull(),
    specialPrice: numeric('special_price', { precision: 12, scale: 2 }),
    proratedPrice: numeric('prorated_price', { precision: 12, scale: 2 }),
    regularPrice: numeric('regular_price', { precision: 12, scale: 2 }),
    customerPrice: numeric('customer_price', { precision: 12, scale: 2 }),
    netUnitPrice: numeric('net_unit_price', { precision: 12, scale: 2 }).notNull(),
    netTotal: numeric('net_total', { precision: 12, scale: 2 }).notNull(),
    // Discount
    discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }),
    // Subscription
    billingType: varchar('billing_type', { length: 20 })
      .notNull()
      .default('recurring'),
    billingFrequency: varchar('billing_frequency', { length: 20 }),
    subscriptionTermMonths: integer('subscription_term_months'),
    // Audit
    pricingAudit: jsonb('pricing_audit').default([]),
    sortOrder: integer('sort_order').notNull().default(10),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'qli_billing_type_check',
      sql`${table.billingType} IN ('recurring', 'one_time', 'usage')`
    ),
    index('qli_quote_order_idx').on(table.quoteId, table.sortOrder),
    index('qli_group_idx').on(table.groupId),
    index('qli_product_idx').on(table.productId),
  ]
);

// ============================================================================
// QUOTE SNAPSHOTS (immutable version history)
// ============================================================================

export const quoteSnapshots = pgTable(
  'quote_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quoteId: uuid('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    snapshotData: jsonb('snapshot_data').notNull(),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('qs_quote_version_unique').on(table.quoteId, table.versionNumber),
  ]
);

// ============================================================================
// QUOTE AUDIT LOG
// ============================================================================

export const quoteAuditLog = pgTable(
  'quote_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quoteId: uuid('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 50 }).notNull(),
    fieldName: varchar('field_name', { length: 100 }),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    changedBy: uuid('changed_by'),
    changedAt: timestamp('changed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('qal_quote_idx').on(table.quoteId, table.changedAt),
  ]
);

// ============================================================================
// APPROVAL RULES
// ============================================================================

export const approvalRules = pgTable(
  'approval_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    entityType: varchar('entity_type', { length: 30 })
      .notNull()
      .default('quote'),
    priority: integer('priority').notNull(),
    conditions: jsonb('conditions').notNull(),
    approverUserId: uuid('approver_user_id'),
    approverRole: varchar('approver_role', { length: 100 }),
    stepNumber: integer('step_number').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('ar_org_active_idx').on(table.orgId, table.isActive, table.priority),
  ]
);

// ============================================================================
// APPROVAL REQUESTS
// ============================================================================

export const approvalRequests = pgTable(
  'approval_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),
    ruleId: uuid('rule_id').references(() => approvalRules.id),
    entityType: varchar('entity_type', { length: 30 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    stepNumber: integer('step_number').notNull(),
    requestedBy: uuid('requested_by'),
    decidedBy: uuid('decided_by'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    comments: text('comments'),
    previousApprovalData: jsonb('previous_approval_data'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'ar_status_check',
      sql`${table.status} IN ('pending', 'approved', 'rejected', 'skipped')`
    ),
    index('ar_entity_idx').on(table.entityType, table.entityId),
    index('ar_org_status_idx').on(table.orgId, table.status),
  ]
);

// ============================================================================
// QUOTE TEMPLATES (for PDF generation)
// ============================================================================

export const quoteTemplates = pgTable('quote_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  config: jsonb('config').notNull().default({}),
  // config shape: { logoUrl, primaryColor, companyName, companyAddress,
  //   footerText, lineColumns[], termsText, conditionalSections[] }
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// QUOTE ATTACHMENTS (generated PDFs)
// ============================================================================

export const quoteAttachments = pgTable(
  'quote_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quoteId: uuid('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    fileName: varchar('file_name', { length: 500 }).notNull(),
    filePath: varchar('file_path', { length: 1000 }).notNull(),
    fileSize: integer('file_size'),
    mimeType: varchar('mime_type', { length: 100 })
      .notNull()
      .default('application/pdf'),
    versionNumber: integer('version_number').notNull(),
    templateId: uuid('template_id').references(() => quoteTemplates.id),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('qa_quote_idx').on(table.quoteId, table.versionNumber),
  ]
);

// ============================================================================
// INVOICES
// ============================================================================

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
    contractId: uuid('contract_id'),
    quoteId: uuid('quote_id').references(() => quotes.id),
    accountHubspotId: varchar('account_hubspot_id', { length: 50 }),
    accountName: varchar('account_name', { length: 255 }),
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    issueDate: date('issue_date').notNull(),
    dueDate: date('due_date').notNull(),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    taxTotal: numeric('tax_total', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    total: numeric('total', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    currencyCode: varchar('currency_code', { length: 3 })
      .notNull()
      .default('CAD'),
    paymentTerms: varchar('payment_terms', { length: 30 }).default('net_30'),
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('invoices_org_number_unique').on(table.orgId, table.invoiceNumber),
    check(
      'invoices_status_check',
      sql`${table.status} IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')`
    ),
    index('invoices_org_status_idx').on(table.orgId, table.status),
    index('invoices_contract_idx').on(table.contractId),
  ]
);

// ============================================================================
// INVOICE LINE ITEMS
// ============================================================================

export const invoiceLineItems = pgTable(
  'invoice_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    productName: varchar('product_name', { length: 255 }).notNull(),
    description: text('description'),
    quantity: numeric('quantity', { precision: 12, scale: 2 })
      .notNull()
      .default('1'),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    billingType: varchar('billing_type', { length: 20 })
      .notNull()
      .default('recurring'),
    billingPeriodStart: date('billing_period_start'),
    billingPeriodEnd: date('billing_period_end'),
    sortOrder: integer('sort_order').notNull().default(10),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('ili_invoice_idx').on(table.invoiceId, table.sortOrder),
  ]
);

// ============================================================================
// SUBSCRIPTION STATE LOG
// ============================================================================

export const subscriptionStateLog = pgTable(
  'subscription_state_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id').notNull(),
    orgId: uuid('org_id').notNull(),
    fromState: varchar('from_state', { length: 30 }).notNull(),
    toState: varchar('to_state', { length: 30 }).notNull(),
    triggeringEvent: varchar('triggering_event', { length: 50 }).notNull(),
    relatedEntityType: varchar('related_entity_type', { length: 30 }),
    relatedEntityId: uuid('related_entity_id'),
    changedBy: uuid('changed_by'),
    changedAt: timestamp('changed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('ssl_subscription_idx').on(table.subscriptionId, table.changedAt),
    index('ssl_org_idx').on(table.orgId, table.changedAt),
  ]
);

// ============================================================================
// Type exports
// ============================================================================

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type PriceBook = typeof priceBooks.$inferSelect;
export type NewPriceBook = typeof priceBooks.$inferInsert;

export type PriceBookEntry = typeof priceBookEntries.$inferSelect;
export type NewPriceBookEntry = typeof priceBookEntries.$inferInsert;

export type DiscountSchedule = typeof discountSchedules.$inferSelect;
export type NewDiscountSchedule = typeof discountSchedules.$inferInsert;

export type DiscountTier = typeof discountTiers.$inferSelect;
export type NewDiscountTier = typeof discountTiers.$inferInsert;

export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;

export type QuoteLineGroup = typeof quoteLineGroups.$inferSelect;
export type NewQuoteLineGroup = typeof quoteLineGroups.$inferInsert;

export type QuoteLineItem = typeof quoteLineItems.$inferSelect;
export type NewQuoteLineItem = typeof quoteLineItems.$inferInsert;

export type QuoteSnapshot = typeof quoteSnapshots.$inferSelect;
export type NewQuoteSnapshot = typeof quoteSnapshots.$inferInsert;

export type ApprovalRule = typeof approvalRules.$inferSelect;
export type NewApprovalRule = typeof approvalRules.$inferInsert;

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type NewApprovalRequest = typeof approvalRequests.$inferInsert;

export type QuoteTemplate = typeof quoteTemplates.$inferSelect;
export type NewQuoteTemplate = typeof quoteTemplates.$inferInsert;

export type QuoteAttachment = typeof quoteAttachments.$inferSelect;
export type NewQuoteAttachment = typeof quoteAttachments.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type NewInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

export type SubscriptionStateLogEntry = typeof subscriptionStateLog.$inferSelect;
export type NewSubscriptionStateLogEntry = typeof subscriptionStateLog.$inferInsert;
